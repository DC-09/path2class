from fastapi import APIRouter, HTTPException

from models.assistant import AssistantRequest, AssistantResponse, SuggestedAction
from services.llm_service import get_llm_service
from services.session_manager import session_manager

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/route_help", response_model=AssistantResponse)
async def route_help(req: AssistantRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update language preference
    session.language = req.user_language

    # Build context from session if not provided
    context = req.context or session.to_context_dict()

    llm = get_llm_service()
    reply = await llm.get_response(req.user_message, context)

    # Generate suggested actions based on context
    suggested = []
    if session.avoid_stairs is False and any(
        s.get("edge_type") == "staircase" for s in session.route_steps
    ):
        suggested.append(SuggestedAction(
            label="Mostra percorso senza scale",
            action_id="alt_route_no_stairs",
        ))

    return AssistantResponse(
        reply=reply,
        suggested_actions=suggested,
        language_used=req.user_language,
    )
