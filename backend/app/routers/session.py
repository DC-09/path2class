from fastapi import APIRouter, HTTPException

from models.session import SessionStartRequest, SessionStartResponse
from services.campus_graph import get_campus_graph
from services.session_manager import session_manager

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("/start", response_model=SessionStartResponse)
async def start_session(req: SessionStartRequest):
    campus = get_campus_graph()
    node = campus.get_node(req.start_node)

    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{req.start_node}' not found in campus graph")

    session = session_manager.create_session(
        start_node=req.start_node,
        building=node["building"] or "?",
        floor=node["floor"],
    )

    return SessionStartResponse(
        session_id=session.session_id,
        location_label=node["label"],
        building=node["building"] or "?",
        floor=node["floor"],
    )
