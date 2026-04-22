import os

from dotenv import load_dotenv

load_dotenv()

DB_PATH = "restaurant.db"
TWILIO_SILENCE_THRESHOLD = int(os.getenv("TWILIO_SILENCE_CHUNKS", "12"))
TWILIO_MIN_SPEECH_CHUNKS = int(os.getenv("TWILIO_MIN_SPEECH_CHUNKS", "8"))
TWILIO_RMS_THRESHOLD = int(os.getenv("TWILIO_RMS_THRESHOLD", "250"))

