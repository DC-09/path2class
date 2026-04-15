"""
Campus graph service: loads the campus topology and provides
routing via Dijkstra / A* with optional accessibility filtering.
"""

import json
import math
from pathlib import Path
from typing import Optional

import networkx as nx

from config import settings


class CampusGraph:
    """In-memory campus graph backed by NetworkX."""

    def __init__(self, graph_path: Optional[str] = None):
        self.graph_path = graph_path or settings.campus_graph_path
        self.G = nx.Graph()
        self.nodes_data: dict = {}
        self._load()

    def _load(self):
        path = Path(self.graph_path)
        if not path.exists():
            raise FileNotFoundError(f"Campus graph not found: {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.campus_name = data.get("campus_name", "Campus")

        # Add nodes
        for node_id, attrs in data["nodes"].items():
            self.G.add_node(node_id, **attrs)
            self.nodes_data[node_id] = attrs

        # Add edges (undirected)
        for edge in data["edges"]:
            self.G.add_edge(
                edge["from"],
                edge["to"],
                distance=edge["distance"],
                edge_type=edge["type"],
                accessible=edge["accessible"],
            )

    def get_node(self, node_id: str) -> Optional[dict]:
        return self.nodes_data.get(node_id)

    def node_exists(self, node_id: str) -> bool:
        return node_id in self.nodes_data

    def get_destinations(self) -> list[dict]:
        """Return all nodes that can be a destination (rooms, landmarks)."""
        destinations = []
        for node_id, attrs in self.nodes_data.items():
            if attrs["type"] in ("room", "landmark"):
                destinations.append({
                    "node_id": node_id,
                    "label": attrs["label"],
                    "building": attrs["building"],
                    "floor": attrs["floor"],
                    "type": attrs["type"],
                })
        destinations.sort(key=lambda d: d["label"])
        return destinations

    def find_route(
        self,
        start_node: str,
        end_node: str,
        avoid_stairs: bool = False,
    ) -> Optional[list[dict]]:
        """
        Compute shortest path from start to end.
        If avoid_stairs=True, edges of type 'staircase' are excluded.
        Returns a list of route steps, or None if no path exists.
        """
        if not self.node_exists(start_node) or not self.node_exists(end_node):
            return None

        # Build a filtered view if accessibility is required
        if avoid_stairs:
            view = nx.subgraph_view(
                self.G,
                filter_edge=lambda u, v: self.G[u][v].get("accessible", True),
            )
        else:
            view = self.G

        try:
            path = nx.dijkstra_path(view, start_node, end_node, weight="distance")
        except nx.NetworkXNoPath:
            return None

        # Convert path to step-by-step instructions
        steps = []
        for i in range(1, len(path)):
            prev_node = path[i - 1]
            curr_node = path[i]
            edge_data = self.G[prev_node][curr_node]
            curr_attrs = self.nodes_data[curr_node]

            action = self._determine_action(edge_data, curr_attrs)
            label = self._build_step_label(action, curr_attrs, edge_data)

            steps.append({
                "node_id": curr_node,
                "action": action,
                "label": label,
                "distance": edge_data["distance"],
                "edge_type": edge_data["edge_type"],
                "floor": curr_attrs["floor"],
            })

        return steps

    def find_nodes_near_room(self, room_label: str) -> list[dict]:
        """Find corridor/junction nodes near a room identified by label substring."""
        results = []
        # First, find the room node
        room_node_id = None
        for node_id, attrs in self.nodes_data.items():
            if room_label.lower() in attrs["label"].lower():
                room_node_id = node_id
                break

        if not room_node_id:
            return results

        # Return the room node and its neighbors
        results.append({"node_id": room_node_id, **self.nodes_data[room_node_id]})
        for neighbor in self.G.neighbors(room_node_id):
            results.append({"node_id": neighbor, **self.nodes_data[neighbor]})

        return results

    def find_nearby_by_type(self, node_id: str, target_type: str, max_hops: int = 3) -> list[dict]:
        """Find nodes of a given type within max_hops edges from node_id."""
        if not self.node_exists(node_id):
            return []

        results = []
        visited = set()
        queue = [(node_id, 0)]

        while queue:
            current, depth = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)

            attrs = self.nodes_data[current]
            if attrs["type"] == target_type and current != node_id:
                results.append({"node_id": current, **attrs})

            if depth < max_hops:
                for neighbor in self.G.neighbors(current):
                    if neighbor not in visited:
                        queue.append((neighbor, depth + 1))

        return results

    def get_total_distance(self, steps: list[dict]) -> float:
        return sum(s["distance"] for s in steps)

    def estimate_walking_minutes(self, steps: list[dict], speed_m_per_min: float = 60.0) -> float:
        """Rough estimate: ~60 meters per minute walking indoors."""
        total = self.get_total_distance(steps)
        return round(total / speed_m_per_min, 1)

    def _determine_action(self, edge_data: dict, target_attrs: dict) -> str:
        edge_type = edge_data["edge_type"]
        node_type = target_attrs["type"]

        if edge_type == "staircase":
            return "climb_stairs"
        elif edge_type == "elevator":
            return "use_elevator"
        elif edge_type == "outdoor":
            return "walk_outdoor"
        elif node_type == "room":
            return "arrive_room"
        elif node_type == "landmark":
            return "arrive_landmark"
        elif node_type == "entrance":
            return "go_to_entrance"
        else:
            return "go_straight"

    def _build_step_label(self, action: str, attrs: dict, edge_data: dict) -> str:
        label = attrs["label"]
        distance = edge_data["distance"]

        labels = {
            "climb_stairs": f"Sali le scale verso {label}",
            "use_elevator": f"Usa l'ascensore verso {label}",
            "walk_outdoor": f"Percorri il tratto esterno ({distance}m) verso {label}",
            "arrive_room": f"Sei arrivato: {label}",
            "arrive_landmark": f"Raggiungi {label}",
            "go_to_entrance": f"Vai verso {label}",
            "go_straight": f"Prosegui verso {label} ({distance}m)",
        }
        return labels.get(action, f"Vai verso {label}")


# Singleton instance
_campus_graph: Optional[CampusGraph] = None


def get_campus_graph() -> CampusGraph:
    global _campus_graph
    if _campus_graph is None:
        _campus_graph = CampusGraph()
    return _campus_graph
