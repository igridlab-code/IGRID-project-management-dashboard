from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class CampusNode(BaseModel):
    id: str
    name: str
    category: str
    description: str = ""
    x: float
    y: float
    z: float = 0.0
    occupied: bool = False
    queue_minutes: float = 0.0
    status_label: Optional[str] = None
    badge_color: Optional[str] = "emerald"
    notes: Optional[str] = ""
    aliases: List[str] = Field(default_factory=list)

class CampusEdge(BaseModel):
    source: str
    target: str
    distance: float
    accessible: bool = True

class CampusBounds(BaseModel):
    min_x: float
    max_x: float
    min_y: float
    max_y: float

class CampusDataResponse(BaseModel):
    campus_name: str
    campus_bounds: CampusBounds
    nodes: List[CampusNode]
    edges: List[CampusEdge]

class WaypointStatus(BaseModel):
    node_id: str
    name: str
    status: str
    occupied: bool = False
    queue_minutes: float = 0.0
    metric_label: str
    metric_value: str
    badge_color: str  # e.g., 'emerald', 'amber', 'rose', 'sky', 'indigo'
    notes: str

class CampusStatusResponse(BaseModel):
    timestamp: str
    statuses: Dict[str, WaypointStatus]

class RouteRequest(BaseModel):
    start_node_id: str
    destination_node_id: str
    accessible_only: bool = False

class WaypointStep(BaseModel):
    step_number: int
    node_id: str
    name: str
    x: float
    y: float
    z: float = 0.0
    occupied: bool = False
    queue_minutes: float = 0.0
    distance_to_next: float = 0.0
    bearing_to_next_degrees: float = 0.0
    instruction: str
    status: Optional[str] = None
    metric_value: Optional[str] = None
    badge_color: Optional[str] = None

class RouteResponse(BaseModel):
    success: bool
    start_node: str
    destination_node: str
    total_distance_meters: float
    estimated_walking_time_minutes: float
    waypoints: List[WaypointStep]
    message: Optional[str] = None

class RecognizedStop(BaseModel):
    id: str
    name: str
    category: str

class RouteLeg(BaseModel):
    leg_index: int
    from_node: str
    to_node: str
    distance_meters: float
    waypoints: List[WaypointStep]

class AgentQueryRequest(BaseModel):
    query: str
    current_node_id: Optional[str] = "gate_1"

class AgentQueryResponse(BaseModel):
    success: bool
    query: str
    clarification_needed: bool = False
    clarification_question: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)
    recognized_stops: List[RecognizedStop] = Field(default_factory=list)
    optimized_sequence: List[str] = Field(default_factory=list)
    legs: List[RouteLeg] = Field(default_factory=list)
    total_stops: int = 0
    total_distance_meters: float = 0.0
    combined_waypoints: List[WaypointStep] = Field(default_factory=list)
    agent_summary: str = ""
    message: Optional[str] = None
