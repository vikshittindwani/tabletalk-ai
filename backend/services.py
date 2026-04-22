import audioop
import base64
import html
import io
import json
import os
import wave
from typing import Any, Dict, List

import requests
from fastapi import Response

from .menu import MENU_BY_ID, MENU_CONTEXT, MENU_ITEMS


def build_confirmation_text(items: List[Dict[str, Any]]) -> str:
    if not items:
        return "I could not confidently match any items from that request."

    item_summary = ", ".join(f"{item['quantity']} x {item['name']}" for item in items)
    return f"I heard {item_summary}. Please review and confirm the order."


def normalize_parsed_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []

    for raw_item in items:
        raw_id = str(raw_item.get("id", "")).strip()
        raw_name = str(raw_item.get("name", "")).strip().lower()
        menu_item = MENU_BY_ID.get(raw_id)

        if not menu_item and raw_name:
            menu_item = next((item for item in MENU_ITEMS if item["name"].lower() == raw_name), None)

        if not menu_item:
            continue

        try:
            quantity = max(1, int(raw_item.get("quantity", 1)))
        except (TypeError, ValueError):
            quantity = 1

        normalized.append({
            **menu_item,
            "quantity": quantity,
            "price": float(menu_item["price"]),
        })

    return normalized


def calculate_total(items: List[Dict[str, Any]]) -> float:
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    return round(subtotal * 1.05, 2)


def customer_name_from_caller(caller: str) -> str:
    digits = "".join(char for char in caller if char.isdigit())
    if len(digits) >= 4:
        return f"Phone Customer {digits[-4:]}"
    return "Phone Customer"


def extract_customer_name(transcript: str) -> str:
    cleaned = transcript.strip()
    if not cleaned:
        return ""

    lowered = cleaned.lower()
    prefixes = [
        "my name is ",
        "this is ",
        "i am ",
        "i'm ",
        "it is ",
        "it's ",
        "name is ",
    ]

    for prefix in prefixes:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break

    cleaned = "".join(char if char.isalpha() or char.isspace() else " " for char in cleaned)
    parts = [part for part in cleaned.split() if part]

    if not parts:
        return ""

    return " ".join(parts[:3]).title()


def transcribe_with_sarvam(wav_bytes: bytes) -> str:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise RuntimeError("SARVAM_API_KEY is required for phone STT.")

    response = requests.post(
        "https://api.sarvam.ai/speech-to-text",
        headers={"api-subscription-key": api_key},
        files={"file": ("call.wav", wav_bytes, "audio/wav")},
        data={
            "model": os.getenv("SARVAM_STT_MODEL", "saaras:v3"),
            "language_code": os.getenv("SARVAM_STT_LANGUAGE_CODE", "en-IN"),
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    return str(payload.get("transcript", "")).strip()


def parse_order_locally(transcript: str):
    matched_items = []
    transcript_lower = transcript.lower()
    quantity_words = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "a ": 1, "an ": 1}

    for item in MENU_ITEMS:
        if item["name"].lower() in transcript_lower:
            qty = 1
            for word, num in quantity_words.items():
                if word in transcript_lower:
                    qty = num
                    break
            matched_items.append({
                **item,
                "quantity": qty,
                "price": float(item["price"]),
            })

    total = calculate_total(matched_items)
    return {
        "items": matched_items,
        "total": total,
        "transcript": transcript,
        "confirmationText": build_confirmation_text(matched_items),
    }


def parse_order_with_groq(transcript: str):
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return parse_order_locally(transcript)

    try:
        from groq import Groq

        client = Groq(api_key=groq_api_key)
        system_prompt = f"""You are a restaurant order parser. Given a customer's voice transcript, extract the order details.

Available menu items:
{MENU_CONTEXT}

Return a JSON object with this exact structure:
{{
  "items": [
    {{"id": "menu_item_id", "name": "item name", "quantity": 1, "price": price_in_rupees}}
  ],
  "confirmationText": "short confirmation sentence for the customer"
}}

Rules:
- Only use menu items from the list above.
- Use the exact menu item id and menu item name.
- If nothing matches, return an empty items array."""

        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript},
            ],
            model=os.getenv("GROQ_ORDER_MODEL", "llama-3.1-8b-instant"),
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        result = json.loads(completion.choices[0].message.content)
        normalized_items = normalize_parsed_items(result.get("items", []))
        return {
            "items": normalized_items,
            "total": calculate_total(normalized_items),
            "transcript": transcript,
            "confirmationText": result.get("confirmationText") or build_confirmation_text(normalized_items),
        }
    except Exception:
        return parse_order_locally(transcript)


def transcript_to_order(transcript: str):
    return parse_order_with_groq(transcript)


def pcm_8k_to_wav_16k_bytes(pcm_8k_bytes: bytes) -> bytes:
    pcm_16k_bytes, _ = audioop.ratecv(pcm_8k_bytes, 2, 1, 8000, 16000, None)
    wav_buffer = io.BytesIO()

    with wave.open(wav_buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(pcm_16k_bytes)

    return wav_buffer.getvalue()


def wav_to_mulaw_8k_bytes(wav_bytes: bytes) -> bytes:
    with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
        channels = wav_file.getnchannels()
        sample_width = wav_file.getsampwidth()
        sample_rate = wav_file.getframerate()
        pcm_bytes = wav_file.readframes(wav_file.getnframes())

    if channels > 1:
        pcm_bytes = audioop.tomono(pcm_bytes, sample_width, 0.5, 0.5)

    if sample_width != 2:
        pcm_bytes = audioop.lin2lin(pcm_bytes, sample_width, 2)

    if sample_rate != 8000:
        pcm_bytes, _ = audioop.ratecv(pcm_bytes, 2, 1, sample_rate, 8000, None)

    return audioop.lin2ulaw(pcm_bytes, 2)


def synthesize_with_sarvam(text: str) -> bytes:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise RuntimeError("SARVAM_API_KEY is required for phone TTS.")

    response = requests.post(
        "https://api.sarvam.ai/text-to-speech",
        headers={
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "target_language_code": os.getenv("SARVAM_LANGUAGE_CODE", "en-IN"),
            "speaker": os.getenv("SARVAM_SPEAKER", "shubh"),
            "model": os.getenv("SARVAM_MODEL", "bulbul:v3"),
            "speech_sample_rate": 8000,
            "output_audio_codec": "wav",
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    encoded_audio = payload.get("audios", [None])[0]
    if not encoded_audio:
        raise RuntimeError("Sarvam TTS did not return audio.")

    wav_bytes = base64.b64decode(encoded_audio)
    return wav_to_mulaw_8k_bytes(wav_bytes)


def build_phone_confirmation(saved_order: Dict[str, Any]) -> str:
    item_summary = ", ".join(f"{item['quantity']} {item['name']}" for item in saved_order["items"])
    total = f"{saved_order['total']:.2f}"
    return (
        f"Thank you. I have confirmed {item_summary}. "
        f"Your order number is {saved_order['orderNumber']}. "
        f"Your total is rupees {total}. "
        f"Our kitchen has started preparing it."
    )


def build_messaging_response(message: str) -> Response:
    escaped_message = html.escape(message)
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>{escaped_message}</Message>
</Response>"""
    return Response(content=xml, media_type="text/xml")

