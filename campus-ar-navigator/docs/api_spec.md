# CampusAR Navigator - API Specification

Base URL: `http://localhost:8000/api`

## 1. Campus Map & Nodes
### `GET /campus/data`
Returns the list of 20 campus POIs/buildings and connectivity edges.

**Response `200 OK`**:
```json
{
  "campus_name": "Nova Tech University Campus",
  "campus_bounds": { "min_x": -150, "max_x": 450, "min_y": -150, "max_y": 450 },
  "nodes": [
    {
      "id": "cs_lab",
      "name": "Computer Science & AI Lab",
      "category": "academic",
      "description": "Advanced AI research clusters...",
      "x": 110,
      "y": 140,
      "z": 0,
      "aliases": ["cs lab", "computer science"]
    }
  ],
  "edges": [
    { "source": "admin_block", "target": "coffee_kiosk", "distance": 50, "accessible": true }
  ]
}
```

---

## 2. Live Waypoint Status
### `GET /campus/status`
Returns real-time simulated telemetry for campus waypoints (lab occupancy, canteen wait times, library study zones, office hours).

**Response `200 OK`**:
```json
{
  "timestamp": "2026-09-10T08:30:00Z",
  "statuses": {
    "cs_lab": {
      "node_id": "cs_lab",
      "name": "Computer Science & AI Lab",
      "status": "Occupied",
      "metric_label": "Seat Occupancy",
      "metric_value": "26 / 30 seats",
      "badge_color": "amber",
      "notes": "Intro to Deep Learning class in session until 3:30 PM"
    },
    "main_canteen": {
      "node_id": "main_canteen",
      "name": "Central Canteen & Food Court",
      "status": "Busy",
      "metric_label": "Queue Wait Time",
      "metric_value": "~5 min wait",
      "badge_color": "emerald",
      "notes": "Fresh meals & juice bar serving now"
    }
  }
}
```

---

## 3. Pathfinding Route
### `POST /route`
Computes the optimal A* path between two waypoints.

**Request Body**:
```json
{
  "start_node_id": "gate_1",
  "destination_node_id": "cs_lab",
  "accessible_only": false
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "start_node": "gate_1",
  "destination_node": "cs_lab",
  "total_distance_meters": 180,
  "estimated_walking_time_minutes": 2.4,
  "waypoints": [
    {
      "step_number": 1,
      "node_id": "gate_1",
      "name": "Main Gate 1",
      "x": 0,
      "y": 0,
      "z": 0,
      "distance_to_next": 72,
      "bearing_to_next_degrees": 33.69,
      "instruction": "Depart Main Gate 1 and walk northeast toward Administration Block",
      "status": "Normal"
    },
    {
      "step_number": 2,
      "node_id": "admin_block",
      "name": "Administration Block",
      "x": 40,
      "y": 60,
      "z": 0,
      "distance_to_next": 50,
      "bearing_to_next_degrees": 53.13,
      "instruction": "Continue past Administration Block toward Express Coffee & Bakery Kiosk",
      "status": "Open until 5:00 PM"
    },
    {
      "step_number": 3,
      "node_id": "coffee_kiosk",
      "name": "Express Coffee & Bakery Kiosk",
      "x": 80,
      "y": 90,
      "z": 0,
      "distance_to_next": 58,
      "bearing_to_next_degrees": 30.96,
      "instruction": "Walk past Express Coffee & Bakery Kiosk toward Computer Science & AI Lab",
      "status": "Queue: 2 min"
    },
    {
      "step_number": 4,
      "node_id": "cs_lab",
      "name": "Computer Science & AI Lab",
      "x": 110,
      "y": 140,
      "z": 0,
      "distance_to_next": 0,
      "bearing_to_next_degrees": 0,
      "instruction": "You have arrived at Computer Science & AI Lab",
      "status": "Occupied (26/30 seats)"
    }
  ]
}
```

---

## 4. AI Multi-Stop Agent Planner
### `POST /agent/query` (also available at `POST /api/agent/query`)
Interprets freeform campus queries (e.g., *"lab poi canteen poi library"*, *"go to CS lab then canteen"*, *"take me to parking"*), extracts campus POIs, optimizes the visiting sequence to minimize walking distance, or returns a clarification question if the query is ambiguous.

Detailed query demonstrations are documented in [agent_examples.md](file:///c:/Users/user/Desktop/IGRID%20project%20management%20dashboard/campus-ar-navigator/docs/agent_examples.md).

**Request Body**:
```json
{
  "query": "lab poi canteen poi library",
  "current_node_id": "gate_1"
}
```

**Response `200 OK` (Resolved & Optimized)**:
```json
{
  "success": true,
  "query": "lab poi canteen poi library",
  "clarification_needed": false,
  "clarification_question": null,
  "suggestions": [],
  "recognized_stops": [
    { "id": "cs_lab", "name": "Computer Science & AI Lab", "category": "academic" },
    { "id": "main_canteen", "name": "Central Canteen & Food Court", "category": "food" },
    { "id": "central_library", "name": "Central Library", "category": "academic" }
  ],
  "optimized_sequence": ["cs_lab", "central_library", "main_canteen"],
  "legs": [
    {
      "leg_index": 1,
      "from_node": "gate_1",
      "to_node": "cs_lab",
      "distance_meters": 180.0,
      "waypoints": [...]
    },
    {
      "leg_index": 2,
      "from_node": "cs_lab",
      "to_node": "central_library",
      "distance_meters": 91.0,
      "waypoints": [...]
    },
    {
      "leg_index": 3,
      "from_node": "central_library",
      "to_node": "main_canteen",
      "distance_meters": 73.0,
      "waypoints": [...]
    }
  ],
  "total_stops": 3,
  "total_distance_meters": 344.0,
  "combined_waypoints": [...],
  "agent_summary": "Optimized 3-stop sequence: Computer Science & AI Lab -> Central Library -> Central Canteen & Food Court. Total distance: 344m (~4 min walk)."
}
```

**Response `200 OK` (Ambiguous Query Requiring Clarification)**:
```json
{
  "success": false,
  "query": "take me to parking",
  "clarification_needed": true,
  "clarification_question": "Did you mean North Visitor Parking A or South Staff Parking B?",
  "suggestions": ["parking_a", "parking_b"],
  "recognized_stops": [],
  "optimized_sequence": [],
  "legs": [],
  "total_stops": 0,
  "total_distance_meters": 0.0,
  "combined_waypoints": [],
  "agent_summary": "Clarification needed: Did you mean North Visitor Parking A or South Staff Parking B?",
  "message": "Ambiguous destination in query"
}
```
