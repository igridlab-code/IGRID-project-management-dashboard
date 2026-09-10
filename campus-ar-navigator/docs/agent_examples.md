# CampusAR Agent Layer — Example Queries & Behaviors

The CampusAR Agent layer (`POST /agent/query`) interprets multi-stop natural language and delimiter-separated POI requests, extracts campus locations, optimizes the traversal sequence to minimize walking distance, and asks clarifying questions when a request is ambiguous.

---

## Example 1: Delimited Multi-Stop Query with Sequence Optimization

**Query:** `"lab poi canteen poi library"`  
**Starting Anchor:** `gate_1` (Main Gate)

### Behavior
1. The parser splits the query along the `poi` delimiters and extracts 3 destinations:
   - `"lab"` ➔ `cs_lab` (Computer Science & AI Lab)
   - `"canteen"` ➔ `main_canteen` (Central Canteen & Food Court)
   - `"library"` ➔ `central_library` (Central Library)
2. **Sequence Optimization:** Rather than walking back and forth between the Canteen and Library (`gate_1 ➔ cs_lab ➔ main_canteen ➔ central_library` = 415m), the A* sequence optimizer detects that `central_library` lies directly between `cs_lab` and `main_canteen`. It reorders the sequence to `[cs_lab, central_library, main_canteen]` saving 71 meters (total: 344m).

### Request
```http
POST /agent/query
Content-Type: application/json

{
  "query": "lab poi canteen poi library",
  "current_node_id": "gate_1"
}
```

### Response (`200 OK`)
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
  "agent_summary": "Optimized 3-stop sequence: Computer Science & AI Lab -> Central Library -> Central Canteen & Food Court. Total distance: 344m (~4 min walk). Live status: Computer Science & AI Lab (Occupied: 26/30 seats); Central Library (Quiet Zone: 18 pods free); Central Canteen & Food Court (Busy: ~5 min wait)."
}
```

---

## Example 2: Natural Language Query with Synonyms & Live Status

**Query:** `"workout at the gym and then grab lunch"`  
**Starting Anchor:** `gate_1` (Main Gate)

### Behavior
1. Identifies intent keywords `"workout"` / `"gym"` ➔ `sports_complex` (Sports Complex & Arena).
2. Identifies `"lunch"` ➔ `main_canteen` (Central Canteen & Food Court).
3. Assembles turn-by-turn guidance and attaches live status metrics (gym capacity and canteen queue time).

### Request
```http
POST /agent/query
Content-Type: application/json

{
  "query": "workout at the gym and then grab lunch",
  "current_node_id": "gate_1"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "query": "workout at the gym and then grab lunch",
  "clarification_needed": false,
  "clarification_question": null,
  "suggestions": [],
  "recognized_stops": [
    { "id": "sports_complex", "name": "Sports Complex & Arena", "category": "sports" },
    { "id": "main_canteen", "name": "Central Canteen & Food Court", "category": "food" }
  ],
  "optimized_sequence": ["sports_complex", "main_canteen"],
  "legs": [
    { "leg_index": 1, "from_node": "gate_1", "to_node": "sports_complex", "distance_meters": 458.0, "waypoints": [...] },
    { "leg_index": 2, "from_node": "sports_complex", "to_node": "main_canteen", "distance_meters": 114.0, "waypoints": [...] }
  ],
  "total_stops": 2,
  "total_distance_meters": 572.0,
  "combined_waypoints": [...],
  "agent_summary": "Optimized 2-stop sequence: Sports Complex & Arena -> Central Canteen & Food Court. Total distance: 572m (~7 min walk). Live status: Sports Complex & Arena (Open: 52% capacity); Central Canteen & Food Court (Moderate: ~4 min wait)."
}
```

---

## Example 3: Ambiguous Query Triggering Clarification Question

**Query:** `"take me to parking"`  
**Starting Anchor:** `gate_1` (Main Gate)

### Behavior
1. The user asks for `"parking"` without indicating whether they are a visitor (Parking A) or faculty/staff (Parking B).
2. The agent detects ambiguity and avoids guessing an incorrect destination.
3. Returns `clarification_needed: true` with a polite clarifying question and clickable suggestions for the frontend UI.

### Request
```http
POST /agent/query
Content-Type: application/json

{
  "query": "take me to parking",
  "current_node_id": "gate_1"
}
```

### Response (`200 OK`)
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
