from pydantic import BaseModel


class RouteRequest(BaseModel):
    session_id: str
    destination_node: str
    avoid_stairs: bool = False


class RouteStep(BaseModel):
    node_id: str
    action: str
    label: str
    distance: float
    edge_type: str
    floor: int


class RouteResponse(BaseModel):
    steps: list[RouteStep]
    total_distance: float
    estimated_minutes: float


class TextRouteStep(BaseModel):
    index: int
    instruction: str
    reference: str


class TextRouteResponse(BaseModel):
    steps: list[TextRouteStep]
    total_steps: int
    estimated_walking_minutes: float


class NavigationUpdateRequest(BaseModel):
    session_id: str
    detections: list[dict] = []
    heading: float = 0.0


class NavigationUpdateResponse(BaseModel):
    position: dict
    next_step: dict | None = None
    position_confirmed: bool = False
    arrived: bool = False
    route_recalculated: bool = False


class DestinationItem(BaseModel):
    node_id: str
    label: str
    building: str
    floor: int
    type: str
