import heapq
import math
from typing import Dict, List, Optional, Tuple
from .models import CampusNode, CampusEdge, WaypointStep, RouteResponse

def calculate_euclidean_distance(node_a: CampusNode, node_b: CampusNode) -> float:
    return math.hypot(node_b.x - node_a.x, node_b.y - node_a.y)

def calculate_bearing(from_node: CampusNode, to_node: CampusNode) -> float:
    """Calculate compass bearing in degrees [0, 360) where 0 is North, 90 is East."""
    dx = to_node.x - from_node.x
    dy = to_node.y - from_node.y
    angle_rad = math.atan2(dx, dy)
    deg = math.degrees(angle_rad)
    return (deg + 360) % 360

def bearing_to_cardinal(bearing: float) -> str:
    cardinals = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"]
    index = int((bearing + 22.5) // 45) % 8
    return cardinals[index]

def compute_turn_instruction(prev_bearing: Optional[float], current_bearing: float, target_name: str, distance: float) -> str:
    cardinal = bearing_to_cardinal(current_bearing)
    if prev_bearing is None:
        return f"Head {cardinal} toward {target_name} ({int(distance)}m)"
    
    diff = (current_bearing - prev_bearing + 180) % 360 - 180
    if abs(diff) < 25:
        turn = "Continue straight"
    elif diff > 60:
        turn = "Turn right"
    elif diff > 20:
        turn = "Turn slight right"
    elif diff < -60:
        turn = "Turn left"
    elif diff < -20:
        turn = "Turn slight left"
    else:
        turn = "Continue"

    return f"{turn} heading {cardinal} toward {target_name} ({int(distance)}m)"

class CampusPathfinder:
    def __init__(self, raw_data: dict):
        self.nodes: Dict[str, CampusNode] = {}
        for n in raw_data["nodes"]:
            self.nodes[n["id"]] = CampusNode(**n)
            
        self.adj: Dict[str, List[Tuple[str, float, bool]]] = {node_id: [] for node_id in self.nodes}
        for e in raw_data["edges"]:
            src = e["source"]
            tgt = e["target"]
            dist = float(e["distance"])
            acc = bool(e.get("accessible", True))
            if src in self.adj and tgt in self.adj:
                self.adj[src].append((tgt, dist, acc))
                self.adj[tgt].append((src, dist, acc))

    def find_shortest_path(self, start_id: str, dest_id: str, accessible_only: bool = False) -> Tuple[Optional[List[str]], float]:
        if start_id not in self.nodes or dest_id not in self.nodes:
            return None, 0.0
            
        if start_id == dest_id:
            return [start_id], 0.0

        dest_node = self.nodes[dest_id]
        
        # Priority queue holds (f_score, current_id)
        open_set = []
        heapq.heappush(open_set, (0.0, start_id))
        
        came_from: Dict[str, str] = {}
        g_score: Dict[str, float] = {node_id: float('inf') for node_id in self.nodes}
        g_score[start_id] = 0.0
        
        f_score: Dict[str, float] = {node_id: float('inf') for node_id in self.nodes}
        f_score[start_id] = calculate_euclidean_distance(self.nodes[start_id], dest_node)
        
        visited = set()

        while open_set:
            _, current = heapq.heappop(open_set)
            
            if current == dest_id:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path, g_score[dest_id]

            if current in visited:
                continue
            visited.add(current)

            for neighbor, weight, accessible in self.adj.get(current, []):
                if accessible_only and not accessible:
                    continue
                
                tentative_g = g_score[current] + weight
                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    h = calculate_euclidean_distance(self.nodes[neighbor], dest_node)
                    f = tentative_g + h
                    f_score[neighbor] = f
                    heapq.heappush(open_set, (f, neighbor))

        return None, 0.0

    def build_route_steps(self, path_ids: List[str], status_service=None) -> List[WaypointStep]:
        if not path_ids:
            return []

        steps: List[WaypointStep] = []
        prev_bearing: Optional[float] = None

        for idx, node_id in enumerate(path_ids):
            curr_node = self.nodes[node_id]
            is_last = (idx == len(path_ids) - 1)
            
            if not is_last:
                next_node = self.nodes[path_ids[idx + 1]]
                dist = calculate_euclidean_distance(curr_node, next_node)
                bearing = calculate_bearing(curr_node, next_node)
                instruction = compute_turn_instruction(prev_bearing, bearing, next_node.name, dist)
                prev_bearing = bearing
            else:
                dist = 0.0
                bearing = 0.0
                instruction = f"Arrived at your destination: {curr_node.name}"

            # Fetch live mock status if service available
            status_text = None
            metric_val = None
            badge_col = None
            occ = curr_node.occupied
            q_min = curr_node.queue_minutes

            if status_service:
                s = status_service.get_status_for_node(node_id)
                status_text = s.status
                metric_val = s.metric_value
                badge_col = s.badge_color
                occ = s.occupied
                q_min = s.queue_minutes

            steps.append(WaypointStep(
                step_number=idx + 1,
                node_id=node_id,
                name=curr_node.name,
                x=curr_node.x,
                y=curr_node.y,
                z=curr_node.z,
                occupied=occ,
                queue_minutes=q_min,
                distance_to_next=round(dist, 1),
                bearing_to_next_degrees=round(bearing, 1),
                instruction=instruction,
                status=status_text,
                metric_value=metric_val,
                badge_color=badge_col
            ))

        return steps

    def get_route(self, start_id: str, dest_id: str, accessible_only: bool = False, status_service=None) -> RouteResponse:
        path, total_dist = self.find_shortest_path(start_id, dest_id, accessible_only)
        if not path:
            return RouteResponse(
                success=False,
                start_node=start_id,
                destination_node=dest_id,
                total_distance_meters=0.0,
                estimated_walking_time_minutes=0.0,
                waypoints=[],
                message=f"No connected path found between '{start_id}' and '{dest_id}'"
            )

        steps = self.build_route_steps(path, status_service)
        # Assuming average walking speed 1.25 m/s (~75 meters/minute)
        walking_time = round(total_dist / 75.0, 1) if total_dist > 0 else 0.0

        return RouteResponse(
            success=True,
            start_node=start_id,
            destination_node=dest_id,
            total_distance_meters=round(total_dist, 1),
            estimated_walking_time_minutes=max(walking_time, 0.5),
            waypoints=steps
        )

def test_graph_connectivity(raw_data: dict) -> bool:
    """Verify that all nodes form a single connected component."""
    pf = CampusPathfinder(raw_data)
    node_ids = list(pf.nodes.keys())
    if not node_ids:
        print("Error: No nodes in campus data")
        return False

    origin = node_ids[0]
    unreachable = []
    for other in node_ids[1:]:
        path, _ = pf.find_shortest_path(origin, other)
        if not path:
            unreachable.append(other)

    if unreachable:
        print(f"Error: Nodes unreachable from {origin}: {unreachable}")
        return False

    print(f"Success: All {len(node_ids)} nodes are fully connected and reachable!")
    return True
