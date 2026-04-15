from fastapi import APIRouter, HTTPException

from models.navigation import (
    DestinationItem,
    NavigationUpdateRequest,
    NavigationUpdateResponse,
    RouteRequest,
    RouteResponse,
    RouteStep,
    TextRouteResponse,
    TextRouteStep,
)
from services.campus_graph import get_campus_graph
from services.position import update_position
from services.session_manager import session_manager

router = APIRouter(prefix="/api/navigation", tags=["navigation"])


@router.get("/destinations", response_model=list[DestinationItem])
async def list_destinations():
    campus = get_campus_graph()
    return campus.get_destinations()


@router.post("/route", response_model=RouteResponse)
async def compute_route(req: RouteRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    campus = get_campus_graph()

    if not campus.node_exists(req.destination_node):
        raise HTTPException(status_code=404, detail=f"Destination '{req.destination_node}' not found")

    steps = campus.find_route(
        session.current_node,
        req.destination_node,
        avoid_stairs=req.avoid_stairs,
    )

    if steps is None:
        raise HTTPException(status_code=422, detail="No route found between these nodes")

    # Save route in session
    session.destination_node = req.destination_node
    session.route_steps = steps
    session.current_step_index = 0
    session.avoid_stairs = req.avoid_stairs

    route_steps = [RouteStep(**s) for s in steps]
    total_dist = campus.get_total_distance(steps)
    est_min = campus.estimate_walking_minutes(steps)

    return RouteResponse(
        steps=route_steps,
        total_distance=total_dist,
        estimated_minutes=est_min,
    )


@router.post("/update", response_model=NavigationUpdateResponse)
async def update_navigation(req: NavigationUpdateRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    campus = get_campus_graph()
    result = update_position(session, req.detections, campus)

    return NavigationUpdateResponse(**result)


@router.get("/text_route", response_model=TextRouteResponse)
async def get_text_route(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.route_steps:
        raise HTTPException(status_code=400, detail="No route computed yet")

    campus = get_campus_graph()
    remaining = session.route_steps[session.current_step_index:]

    text_steps = []
    for i, step in enumerate(remaining, 1):
        node_data = campus.get_node(step["node_id"])
        reference = ""
        if node_data:
            if node_data["type"] == "room":
                reference = f"Vedrai la targa '{node_data['label']}' sulla porta."
            elif node_data["type"] == "staircase":
                reference = "Le scale si trovano lungo il corridoio."
            elif node_data["type"] == "elevator":
                reference = "L'ascensore è accanto alle scale."
            elif node_data["type"] == "landmark":
                reference = f"Punto di riferimento: {node_data['label']}."

        text_steps.append(TextRouteStep(
            index=i,
            instruction=step["label"],
            reference=reference,
        ))

    est_min = campus.estimate_walking_minutes(remaining)

    return TextRouteResponse(
        steps=text_steps,
        total_steps=len(text_steps),
        estimated_walking_minutes=est_min,
    )
