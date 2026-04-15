"""
In-memory session manager.
Tracks active navigation sessions: position, route, detections history.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional


class Session:
    def __init__(self, session_id: str, start_node: str, building: str, floor: int):
        self.session_id = session_id
        self.start_node = start_node
        self.current_node = start_node
        self.building = building
        self.floor = floor
        self.confidence = 0.99  # QR scan = high confidence
        self.destination_node: Optional[str] = None
        self.route_steps: list[dict] = []
        self.current_step_index: int = 0
        self.avoid_stairs: bool = False
        self.detection_history: list[dict] = []
        self.language: str = "it"
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def to_context_dict(self) -> dict:
        """Build the structured context for the LLM assistant."""
        remaining = self.route_steps[self.current_step_index:]
        recent_detections = self.detection_history[-5:] if self.detection_history else []

        return {
            "current_position": {
                "node_id": self.current_node,
                "building": self.building,
                "floor": self.floor,
                "confidence": self.confidence,
            },
            "destination": {
                "node_id": self.destination_node,
            },
            "remaining_steps": remaining,
            "recent_detections": recent_detections,
            "accessibility": {"avoid_stairs": self.avoid_stairs},
            "user_language": self.language,
        }


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create_session(self, start_node: str, building: str, floor: int) -> Session:
        session_id = str(uuid.uuid4())[:8]
        session = Session(session_id, start_node, building, floor)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str):
        self._sessions.pop(session_id, None)


# Singleton
session_manager = SessionManager()
