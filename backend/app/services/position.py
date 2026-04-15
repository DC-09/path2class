"""
Position estimation service.
Fuses YOLO detections with campus graph to update the user's position.
"""

from datetime import datetime, timezone
from typing import Optional

from services.campus_graph import CampusGraph
from services.session_manager import Session


# YOLO class names (must match training config)
CLASS_NAMES = [
    "sign_room_number",
    "sign_building_name",
    "direction_arrow",
    "entrance_door",
    "elevator_door",
    "staircase",
    "ramp",
    "path2class_qr",
    "campus_landmark",
]

CONFIDENCE_DECAY = 0.95
MIN_DETECTION_CONFIDENCE = 0.55


def update_position(
    session: Session,
    detections: list[dict],
    campus: CampusGraph,
) -> dict:
    """
    Update session position based on YOLO detections.
    Returns a summary dict with position info and flags.
    """
    any_useful = False
    route_recalculated = False

    for det in detections:
        conf = det.get("confidence", 0)
        class_name = det.get("class_name", "")
        if conf < MIN_DETECTION_CONFIDENCE:
            continue

        # QR code: exact re-localization
        if class_name == "path2class_qr":
            qr_node = _resolve_qr(det, campus)
            if qr_node:
                _set_position(session, qr_node, campus, confidence=0.99)
                any_useful = True
                continue

        # Room sign: localize to nearby corridor
        if class_name == "sign_room_number":
            label = det.get("label", "")
            if label:
                candidates = campus.find_nodes_near_room(label)
                if candidates:
                    _set_position(session, candidates[0]["node_id"], campus, confidence=min(0.95, conf))
                    any_useful = True
                    continue

        # Staircase / elevator: confirm transition node
        if class_name in ("staircase", "elevator_door"):
            target_type = "staircase" if class_name == "staircase" else "elevator"
            nearby = campus.find_nearby_by_type(session.current_node, target_type, max_hops=2)
            if nearby:
                _set_position(session, nearby[0]["node_id"], campus, confidence=max(session.confidence, 0.85))
                any_useful = True
                continue

        # Landmark: approximate confirmation
        if class_name == "campus_landmark":
            any_useful = True
            session.confidence = max(session.confidence, 0.75)

    # Decay confidence if nothing useful was detected
    if not any_useful:
        session.confidence *= CONFIDENCE_DECAY

    # Check if current position is still on route; if not, recalculate
    if session.route_steps and session.destination_node:
        on_route = _check_on_route(session)
        if not on_route:
            new_steps = campus.find_route(
                session.current_node,
                session.destination_node,
                avoid_stairs=session.avoid_stairs,
            )
            if new_steps:
                session.route_steps = new_steps
                session.current_step_index = 0
                route_recalculated = True

    # Advance step index if we've reached the next expected node
    _advance_step(session)

    # Check arrival
    arrived = session.current_node == session.destination_node

    # Store detection in history
    session.detection_history.extend(detections)
    session.updated_at = datetime.now(timezone.utc)

    # Build next step info
    next_step = None
    if session.route_steps and session.current_step_index < len(session.route_steps):
        next_step = session.route_steps[session.current_step_index]

    return {
        "position": {
            "node_id": session.current_node,
            "building": session.building,
            "floor": session.floor,
            "confidence": round(session.confidence, 3),
        },
        "next_step": next_step,
        "position_confirmed": any_useful,
        "arrived": arrived,
        "route_recalculated": route_recalculated,
    }


def _set_position(session: Session, node_id: str, campus: CampusGraph, confidence: float):
    node = campus.get_node(node_id)
    if node:
        session.current_node = node_id
        session.building = node["building"] or session.building
        session.floor = node["floor"]
        session.confidence = confidence


def _resolve_qr(det: dict, campus: CampusGraph) -> Optional[str]:
    """Try to match a detected QR to a known node via qr_id."""
    qr_data = det.get("qr_data", "")
    if not qr_data:
        return None
    for node_id, attrs in campus.nodes_data.items():
        if attrs.get("qr_id") == qr_data:
            return node_id
    return None


def _check_on_route(session: Session) -> bool:
    """Check if current node is one of the expected route nodes."""
    for i, step in enumerate(session.route_steps[session.current_step_index:], start=session.current_step_index):
        if step["node_id"] == session.current_node:
            return True
    return False


def _advance_step(session: Session):
    """Move current_step_index forward if we've arrived at the current step's node."""
    while session.current_step_index < len(session.route_steps):
        step = session.route_steps[session.current_step_index]
        if step["node_id"] == session.current_node:
            session.current_step_index += 1
        else:
            break
