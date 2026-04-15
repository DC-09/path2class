from pydantic import BaseModel


class AssistantRequest(BaseModel):
    session_id: str
    user_message: str
    user_language: str = "it"
    context: dict | None = None


class SuggestedAction(BaseModel):
    label: str
    action_id: str


class AssistantResponse(BaseModel):
    reply: str
    suggested_actions: list[SuggestedAction] = []
    language_used: str
