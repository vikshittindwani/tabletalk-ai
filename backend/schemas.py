from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


@dataclass
class CallSession:
    stream_sid: str
    call_sid: str = ""
    caller: str = "Phone Customer"
    current_audio: bytearray = field(default_factory=bytearray)
    speech_chunks: int = 0
    silence_chunks: int = 0
    speaking: bool = False
    stage: str = "awaiting_order"
    pending_order: Optional[Dict[str, Any]] = None
    name_retry_count: int = 0
    order_finalized: bool = False


@dataclass
class WhatsAppSession:
    sender: str
    stage: str = "awaiting_order"
    pending_order: Optional[Dict[str, Any]] = None
    name_retry_count: int = 0


class OrderItemIn(BaseModel):
    id: str
    name: str
    quantity: int
    price: float
    description: Optional[str] = ""
    category: Optional[str] = ""
    isVeg: Optional[bool] = True
    isBestseller: Optional[bool] = False
    rating: Optional[float] = 0
    reviews: Optional[int] = 0
    emoji: Optional[str] = ""


class CreateOrderRequest(BaseModel):
    customerName: str
    items: List[OrderItemIn]
    total: float


class UpdateStatusRequest(BaseModel):
    status: str


class VoiceOrderRequest(BaseModel):
    transcript: str

