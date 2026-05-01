import audioop
import base64
import html
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Optional
from urllib.parse import parse_qs

from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

from .config import TWILIO_MIN_SPEECH_CHUNKS, TWILIO_RMS_THRESHOLD, TWILIO_SILENCE_THRESHOLD
from .menu import MENU_ITEMS
from .schemas import CallSession, CreateOrderRequest, UpdateStatusRequest, VoiceOrderRequest, WhatsAppSession
from .services import (
    build_messaging_response,
    build_phone_confirmation,
    customer_name_from_caller,
    extract_customer_name,
    pcm_8k_to_wav_16k_bytes,
    synthesize_with_sarvam,
    transcript_to_order,
    transcribe_with_sarvam,
)

app = FastAPI(title="Restaurant AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

call_sessions: Dict[str, CallSession] = {}
whatsapp_sessions: Dict[str, WhatsAppSession] = {}

# Explicitly load the .env file from the project root directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(project_root, ".env"))
load_dotenv(os.path.join(project_root, ".env.local"))

supabase_url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key: str = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
)

if not supabase_url or not supabase_key:
    raise RuntimeError("Supabase environment variables are missing. Please check your .env file.")
supabase: Client = create_client(supabase_url, supabase_key)

def row_to_order(row: dict):
    return {
        "id": str(row["id"]),
        "orderNumber": row.get("order_number"),
        "customerName": row.get("customer_name"),
        "items": row.get("items", []),
        "total": float(row.get("total", 0)),
        "status": row.get("status"),
        "timestamp": row.get("timestamp"),
        "estimatedTime": row.get("estimated_time", 18)
    }

def save_order(customer_name: str, items: list, total: float):
    order_number = 1000 + (int(datetime.utcnow().timestamp()) % 9000)
    try:
        response = supabase.table("orders").insert({
            "id": str(uuid.uuid4()),
            "order_number": order_number,
            "customer_name": customer_name,
            "items": items,
            "total": total,
            "status": "pending",
            "timestamp": datetime.utcnow().isoformat(),
            "estimated_time": 20,
        }).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to save order: {error}") from error

    if not response.data:
        raise HTTPException(status_code=500, detail="Order was not saved.")
    return row_to_order(response.data[0])

async def send_twilio_audio(websocket: WebSocket, stream_sid: str, mulaw_audio: bytes):
    chunk_size = 160

    for index in range(0, len(mulaw_audio), chunk_size):
        chunk = mulaw_audio[index:index + chunk_size]
        message = {
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": base64.b64encode(chunk).decode("ascii"),
            },
        }
        await websocket.send_text(json.dumps(message))

    await websocket.send_text(json.dumps({
        "event": "mark",
        "streamSid": stream_sid,
        "mark": {"name": "response_complete"},
    }))


async def handle_utterance(websocket: WebSocket, session: CallSession, mulaw_audio: bytes):
    pcm_8k = audioop.ulaw2lin(mulaw_audio, 2)
    wav_bytes = pcm_8k_to_wav_16k_bytes(pcm_8k)
    transcript = transcribe_with_sarvam(wav_bytes)

    if not transcript:
        audio = synthesize_with_sarvam("Sorry, I could not hear the order clearly. Please try again.")
        await send_twilio_audio(websocket, session.stream_sid, audio)
        return

    if session.stage == "awaiting_order":
        parsed = transcript_to_order(transcript)
        if not parsed["items"]:
            audio = synthesize_with_sarvam("Sorry, I could not match that to our menu. Please say your order again.")
            await send_twilio_audio(websocket, session.stream_sid, audio)
            return

        session.pending_order = parsed
        session.stage = "awaiting_name"
        session.name_retry_count = 0
        response_text = (
            f"{parsed['confirmationText']} "
            f"Your total is rupees {parsed['total']:.2f}. "
            "Please say your name to confirm the order."
        )
        audio = synthesize_with_sarvam(response_text)
        await send_twilio_audio(websocket, session.stream_sid, audio)
        return

    if session.stage == "awaiting_name":
        customer_name = extract_customer_name(transcript)
        if not customer_name:
            session.name_retry_count += 1
            retry_text = "I did not catch the name clearly. Please say only your name to confirm the order."
            if session.name_retry_count >= 2:
                fallback_name = customer_name_from_caller(session.caller)
                retry_text = (
                    f"I will use {fallback_name}. "
                    "If that is okay, please say confirm. Otherwise, say your name again."
                )
                session.stage = "awaiting_name_confirmation"
            audio = synthesize_with_sarvam(retry_text)
            await send_twilio_audio(websocket, session.stream_sid, audio)
            return

        session.name_retry_count = 0
        session.caller = customer_name
        pending_order = session.pending_order or {"items": [], "total": 0}
        saved_order = save_order(customer_name, pending_order["items"], pending_order["total"])
        response_text = f"Thank you {customer_name}. {build_phone_confirmation(saved_order)}"
        audio = synthesize_with_sarvam(response_text)
        await send_twilio_audio(websocket, session.stream_sid, audio)
        session.order_finalized = True
        return

    if session.stage == "awaiting_name_confirmation":
        if "confirm" in transcript.lower():
            customer_name = customer_name_from_caller(session.caller)
            pending_order = session.pending_order or {"items": [], "total": 0}
            saved_order = save_order(customer_name, pending_order["items"], pending_order["total"])
            response_text = f"Thank you. {build_phone_confirmation(saved_order)}"
            audio = synthesize_with_sarvam(response_text)
            await send_twilio_audio(websocket, session.stream_sid, audio)
            session.order_finalized = True
            return

        session.stage = "awaiting_name"
        audio = synthesize_with_sarvam("Okay. Please say your name again to confirm the order.")
        await send_twilio_audio(websocket, session.stream_sid, audio)


def should_finalize_utterance(session: CallSession) -> bool:
    return (
        session.speaking
        and session.speech_chunks >= TWILIO_MIN_SPEECH_CHUNKS
        and session.silence_chunks >= TWILIO_SILENCE_THRESHOLD
    )


def handle_whatsapp_message(sender: str, message_body: str) -> str:
    session = whatsapp_sessions.get(sender)
    if not session:
        session = WhatsAppSession(sender=sender)
        whatsapp_sessions[sender] = session

    incoming_text = message_body.strip()
    if not incoming_text:
        return "Please send your order as a message."

    if incoming_text.lower() in {"cancel", "start over", "reset"}:
        whatsapp_sessions.pop(sender, None)
        return "Okay, I cleared the current order. Please send your order again."

    if session.stage == "awaiting_order":
        parsed = transcript_to_order(incoming_text)
        if not parsed["items"]:
            return "I could not match that to our menu. Please send your order again."

        session.pending_order = parsed
        session.stage = "awaiting_name"
        session.name_retry_count = 0
        return (
            f"{parsed['confirmationText']} "
            f"Your total is Rs.{parsed['total']:.2f}. "
            "Please reply with your name to confirm the order."
        )

    customer_name = extract_customer_name(incoming_text)
    if not customer_name:
        session.name_retry_count += 1
        return "I did not catch the name clearly. Please reply with only your name."

    pending_order = session.pending_order or {"items": [], "total": 0}
    saved_order = save_order(customer_name, pending_order["items"], pending_order["total"])
    whatsapp_sessions.pop(sender, None)
    return (
        f"Thank you {customer_name}. "
        f"Your order #{saved_order['orderNumber']} is confirmed. "
        f"Total: Rs.{saved_order['total']:.2f}. "
        "Our kitchen has started preparing it."
    )


@app.get("/")
def root():
    return {
        "message": "Restaurant AI API is running",
        "phoneAgentConfigured": bool(
            os.getenv("TWILIO_STREAM_URL")
            and os.getenv("GROQ_API_KEY")
            and os.getenv("SARVAM_API_KEY")
        ),
    }


@app.get("/api/menu")
def get_menu():
    return {"items": MENU_ITEMS}


@app.post("/api/orders")
def create_order(body: CreateOrderRequest):
    items = [item.dict() for item in body.items]
    return save_order(body.customerName, items, body.total)


@app.get("/api/orders")
def get_orders():
    try:
        response = supabase.table("orders").select("*").order("timestamp", desc=True).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to load orders: {error}") from error

    return {"orders": [row_to_order(row) for row in response.data]}


@app.patch("/api/orders/{order_id}")
def update_order_status(order_id: str, body: UpdateStatusRequest):
    valid_statuses = {"pending", "preparing", "ready", "completed"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    try:
        response = supabase.table("orders").update({"status": body.status}).eq("id", order_id).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to update order: {error}") from error

    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return row_to_order(response.data[0])


@app.post("/api/voice")
def process_voice_order(body: VoiceOrderRequest):
    return transcript_to_order(body.transcript)


@app.get("/api/phone-agent/status")
def phone_agent_status():
    return {
        "twilioVoiceWebhook": "/twilio/voice",
        "twilioMediaStream": "/twilio/media-stream",
        "twilioWhatsAppWebhook": "/whatsapp/incoming",
        "configured": {
            "twilioStreamUrl": bool(os.getenv("TWILIO_STREAM_URL")),
            "groqApiKey": bool(os.getenv("GROQ_API_KEY")),
            "sarvamApiKey": bool(os.getenv("SARVAM_API_KEY")),
        },
        "activeCalls": len(call_sessions),
        "activeWhatsAppSessions": len(whatsapp_sessions),
    }


@app.api_route("/twilio/voice", methods=["GET", "POST"])
async def twilio_voice_webhook(request: Request):
    stream_url = os.getenv("TWILIO_STREAM_URL")
    if not stream_url:
        stream_url = str(request.url_for("twilio_media_stream"))
        stream_url = stream_url.replace("https://", "wss://", 1).replace("http://", "ws://", 1)

    if not stream_url:
        xml = "<Response><Say>The AI ordering line is not configured yet. Please contact the restaurant.</Say></Response>"
        return Response(content=xml, media_type="text/xml")

    caller = "Unknown caller"
    if request.method == "POST":
        body = (await request.body()).decode("utf-8", errors="ignore")
        form = parse_qs(body)
        caller = form.get("From", [caller])[0]
    caller_value = html.escape(caller, quote=True)
    stream_value = html.escape(stream_url, quote=True)

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello. Welcome to Table Talk AI. Please say your order after the tone. After that, I will ask for your name to confirm it.</Say>
  <Connect>
    <Stream url="{stream_value}">
      <Parameter name="caller" value="{caller_value}" />
    </Stream>
  </Connect>
</Response>"""
    return Response(content=xml, media_type="text/xml")


@app.api_route("/whatsapp/incoming", methods=["GET", "POST"])
async def whatsapp_incoming(request: Request):
    if request.method == "GET":
        return build_messaging_response("WhatsApp webhook is live. Send your order to begin.")

    form = await request.form()
    sender = str(form.get("From", "whatsapp:unknown"))
    body = str(form.get("Body", ""))
    reply_text = handle_whatsapp_message(sender, body)
    return build_messaging_response(reply_text)


@app.websocket("/twilio/media-stream")
async def twilio_media_stream(websocket: WebSocket):
    await websocket.accept()
    session: Optional[CallSession] = None

    try:
        while True:
            raw_message = await websocket.receive_text()
            message = json.loads(raw_message)
            event_type = message.get("event")

            if event_type == "start":
                start_data = message.get("start", {})
                stream_sid = message.get("streamSid") or start_data.get("streamSid", "")
                custom_parameters = start_data.get("customParameters", {})
                session = CallSession(
                    stream_sid=stream_sid,
                    call_sid=start_data.get("callSid", ""),
                    caller=custom_parameters.get("caller", "Phone Customer"),
                )
                call_sessions[stream_sid] = session
                continue

            if event_type == "media" and session and not session.order_finalized:
                payload = message.get("media", {}).get("payload")
                if not payload:
                    continue

                mulaw_chunk = base64.b64decode(payload)
                pcm_chunk = audioop.ulaw2lin(mulaw_chunk, 2)
                rms = audioop.rms(pcm_chunk, 2)

                if rms >= TWILIO_RMS_THRESHOLD:
                    session.speaking = True
                    session.speech_chunks += 1
                    session.silence_chunks = 0
                    session.current_audio.extend(mulaw_chunk)
                elif session.speaking:
                    session.silence_chunks += 1
                    session.current_audio.extend(mulaw_chunk)

                if should_finalize_utterance(session):
                    utterance_audio = bytes(session.current_audio)
                    session.current_audio.clear()
                    session.speaking = False
                    session.speech_chunks = 0
                    session.silence_chunks = 0

                    try:
                        await handle_utterance(websocket, session, utterance_audio)
                    except Exception:
                        fallback_audio = synthesize_with_sarvam(
                            "Sorry, the AI ordering line hit a problem. Please call again in a moment."
                        )
                        await send_twilio_audio(websocket, session.stream_sid, fallback_audio)
                        session.order_finalized = True

                continue

            if event_type == "stop":
                break
    except WebSocketDisconnect:
        pass
    finally:
        if session:
            call_sessions.pop(session.stream_sid, None)
