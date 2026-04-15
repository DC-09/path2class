from pydantic import BaseModel


class SessionStartRequest(BaseModel):
    start_node: str


class SessionStartResponse(BaseModel):
    session_id: str
    location_label: str
    building: str
    floor: int
