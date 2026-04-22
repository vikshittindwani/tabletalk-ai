import json
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List

from .config import DB_PATH


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            timestamp TEXT NOT NULL,
            estimated_time INTEGER DEFAULT 20
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS order_counter (
            id INTEGER PRIMARY KEY,
            next_number INTEGER DEFAULT 1044
        )
        """
    )
    conn.execute("INSERT OR IGNORE INTO order_counter (id, next_number) VALUES (1, 1044)")
    conn.commit()
    conn.close()


def row_to_order(row):
    return {
        "id": row["id"],
        "orderNumber": row["order_number"],
        "customerName": row["customer_name"],
        "items": json.loads(row["items"]),
        "total": row["total"],
        "status": row["status"],
        "timestamp": row["timestamp"],
        "estimatedTime": row["estimated_time"],
    }


def save_order(customer_name: str, items: List[Dict[str, Any]], total: float):
    conn = get_db()
    try:
        row = conn.execute("SELECT next_number FROM order_counter WHERE id = 1").fetchone()
        order_number = row["next_number"]
        conn.execute("UPDATE order_counter SET next_number = next_number + 1 WHERE id = 1")

        order_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        items_json = json.dumps(items)

        conn.execute(
            "INSERT INTO orders (id, order_number, customer_name, items, total, status, timestamp, estimated_time) VALUES (?, ?, ?, ?, ?, 'pending', ?, 20)",
            (order_id, order_number, customer_name, items_json, total, timestamp),
        )
        conn.commit()

        saved = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        return row_to_order(saved)
    finally:
        conn.close()

