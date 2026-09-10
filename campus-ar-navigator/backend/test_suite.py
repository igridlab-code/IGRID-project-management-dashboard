import json
import math
import os
import sys
import heapq

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.pathfinding import CampusPathfinder, calculate_bearing
from backend.status_service import StatusService
from backend.agent import CampusAgent
from backend.models import AgentQueryRequest

def run_dijkstra_ground_truth(adj: dict, start: str, dest: str):
    """Independent Dijkstra algorithm to serve as ground-truth for A* verification."""
    pq = [(0.0, start, [start])]
    visited = {}

    while pq:
        dist, curr, path = heapq.heappop(pq)
        if curr in visited and visited[curr] <= dist:
            continue
        visited[curr] = dist

        if curr == dest:
            return path, dist

        for neighbor, weight, _ in adj.get(curr, []):
            if neighbor not in visited:
                heapq.heappush(pq, (dist + weight, neighbor, path + [neighbor]))

    return None, float('inf')

def test_astar_5_cases():
    print("=" * 60)
    print("TEST SUITE 1: A* Shortest Path Verification (5 Test Cases)")
    print("=" * 60)

    # Load campus data
    campus_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "campus_data.json")
    with open(campus_path, "r", encoding="utf-8") as f:
        campus_data = json.load(f)

    pf = CampusPathfinder(campus_data)

    test_cases = [
        ("main_gate", "admin_office", "Case 1: Direct Entry (Main Gate -> Admin Office)"),
        ("main_gate", "cs_lab", "Case 2: Entry to Academic Quad (Main Gate -> CS Lab)"),
        ("cs_lab", "main_canteen", "Case 3: Academic to Dining (CS Lab -> Main Canteen)"),
        ("boys_hostel_1", "south_gate", "Case 4: Cross-Campus North to South (Boys Hostel 1 -> South Gate)"),
        ("sports_complex", "girls_hostel", "Case 5: Recreation to Residence (Sports Complex -> Girls Hostel)"),
    ]

    for start_id, dest_id, case_label in test_cases:
        # 1. Run A* pathfinding
        astar_path, astar_dist = pf.find_shortest_path(start_id, dest_id)
        
        # 2. Run Ground Truth Dijkstra
        dijk_path, dijk_dist = run_dijkstra_ground_truth(pf.adj, start_id, dest_id)

        print(f"\n{case_label}")
        print(f"  Start: {start_id} -> Destination: {dest_id}")
        print(f"  A* Path:     {' -> '.join(astar_path)}")
        print(f"  A* Distance: {astar_dist:.1f} meters")
        print(f"  Dijkstra GT: {dijk_dist:.1f} meters")

        # Assertions
        assert astar_path is not None, f"A* failed to find path for {case_label}"
        assert math.isclose(astar_dist, dijk_dist, rel_tol=1e-4), (
            f"A* distance ({astar_dist}) does not match Dijkstra ground truth ({dijk_dist}) for {case_label}"
        )
        print(f"  [OK] PASS: A* computed the exact optimal shortest path ({astar_dist:.1f}m)")

    print("\n[OK] ALL 5 A* TEST CASES PASSED WITH 100% MATHEMATICAL ACCURACY!\n")

def test_agent_multi_stop():
    print("=" * 60)
    print("TEST SUITE 2: Agent Endpoint & Multi-Stop Query Verification")
    print("=" * 60)

    campus_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "campus_data.json")
    with open(campus_path, "r", encoding="utf-8") as f:
        campus_data = json.load(f)

    pf = CampusPathfinder(campus_data)
    ss = StatusService(campus_data["nodes"])
    agent = CampusAgent(pf, ss)

    # 1. Delimited Query with "poi": "lab poi canteen poi library"
    q1 = "lab poi canteen poi library"
    res1 = agent.process_query(AgentQueryRequest(query=q1, current_node_id="main_gate"))
    print(f"\nQuery 1: '{q1}'")
    print(f"  Recognized Stops: {[s.name for s in res1.recognized_stops]}")
    print(f"  Optimized Sequence: {res1.optimized_sequence}")
    print(f"  Total Legs: {len(res1.legs)} | Total Distance: {res1.total_distance_meters}m")
    assert res1.success is True
    assert res1.clarification_needed is False
    assert len(res1.recognized_stops) == 3
    assert "cs_lab" in res1.optimized_sequence
    assert "main_canteen" in res1.optimized_sequence
    assert "central_library" in res1.optimized_sequence
    print("  [OK] PASS: Successfully parsed 3 POIs with 'poi' delimiter and generated optimized route.")

    # 2. Natural Multi-Stop Query: "workout at the gym and then grab lunch"
    q2 = "workout at the gym and then grab lunch"
    res2 = agent.process_query(AgentQueryRequest(query=q2, current_node_id="main_gate"))
    print(f"\nQuery 2: '{q2}'")
    print(f"  Recognized Stops: {[s.name for s in res2.recognized_stops]}")
    assert res2.success is True
    assert len(res2.recognized_stops) == 2
    assert res2.recognized_stops[0].id == "sports_complex"
    assert res2.recognized_stops[1].id == "main_canteen"
    print("  [OK] PASS: Successfully extracted synonyms (gym -> sports_complex, lunch -> main_canteen).")

    # 3. Chained Sequence Query: "go to CS lab then canteen"
    q3 = "go to CS lab then canteen"
    res3 = agent.process_query(AgentQueryRequest(query=q3, current_node_id="main_gate"))
    print(f"\nQuery 3: '{q3}'")
    print(f"  Recognized Stops: {[s.name for s in res3.recognized_stops]}")
    assert res3.success is True
    assert len(res3.recognized_stops) == 2
    assert res3.recognized_stops[0].id == "cs_lab"
    assert res3.recognized_stops[1].id == "main_canteen"
    print("  [OK] PASS: Successfully processed 'then' sequential multi-stop route.")

    # 4. Ambiguity Query: "take me to parking" (Triggers clarification)
    q4 = "take me to parking"
    res4 = agent.process_query(AgentQueryRequest(query=q4, current_node_id="main_gate"))
    print(f"\nQuery 4: '{q4}' (Ambiguity test)")
    print(f"  Clarification Needed: {res4.clarification_needed}")
    print(f"  Clarification Question: {res4.clarification_question}")
    print(f"  Suggestions: {res4.suggestions}")
    assert res4.success is False
    assert res4.clarification_needed is True
    assert res4.clarification_question is not None
    assert len(res4.suggestions) == 2
    print("  [OK] PASS: Correctly detected ambiguous POI and generated clarifying question.")

    print("\n[OK] ALL AGENT MULTI-STOP TESTS PASSED!\n")

def test_frontend_arrow_math():
    print("=" * 60)
    print("TEST SUITE 3: Frontend Arrow Math (Bearing & Yaw Delta Calculations)")
    print("=" * 60)

    def compute_bearing_js(x1, y1, x2, y2):
        dx = x2 - x1
        dy = y2 - y1
        deg = math.atan2(dx, dy) * (180.0 / math.pi)
        return (deg + 360.0) % 360.0

    def compute_delta_yaw(target_bearing, device_heading):
        return (target_bearing - device_heading + 540.0) % 360.0 - 180.0

    bearing_cases = [
        (0, 0, 0, 100, 0.0, "Due North (dy > 0, dx = 0)"),
        (0, 0, 100, 0, 90.0, "Due East (dx > 0, dy = 0)"),
        (0, 0, 0, -100, 180.0, "Due South (dy < 0, dx = 0)"),
        (0, 0, -100, 0, 270.0, "Due West (dx < 0, dy = 0)"),
        (0, 0, 50, 50, 45.0, "Northeast (45 deg)"),
        (0, 0, 50, -50, 135.0, "Southeast (135 deg)"),
        (0, 0, -50, -50, 225.0, "Southwest (225 deg)"),
        (0, 0, -50, 50, 315.0, "Northwest (315 deg)"),
    ]

    for x1, y1, x2, y2, expected, desc in bearing_cases:
        calculated = compute_bearing_js(x1, y1, x2, y2)
        print(f"  Vector ({x1},{y1}) -> ({x2},{y2}) [{desc}]:")
        print(f"    Calculated Bearing: {calculated:.1f} deg | Expected: {expected:.1f} deg")
        assert math.isclose(calculated, expected, abs_tol=1e-4), f"Failed for {desc}: got {calculated}"
        print(f"    [OK] PASS")

    print("\nTesting Circular Wrap-Around Delta Yaw Math (Turn Directions):")
    delta_cases = [
        (10.0, 350.0, 20.0, "Facing 350 deg, target at 10 deg -> should turn right +20 deg"),
        (350.0, 10.0, -20.0, "Facing 10 deg, target at 350 deg -> should turn left -20 deg"),
        (90.0, 0.0, 90.0, "Facing 0 deg (North), target at 90 deg (East) -> turn right +90 deg"),
        (270.0, 0.0, -90.0, "Facing 0 deg (North), target at 270 deg (West) -> turn left -90 deg"),
        (180.0, 180.0, 0.0, "Facing 180 deg, target at 180 deg -> straight ahead 0 deg"),
    ]

    for target_b, dev_h, exp_delta, desc in delta_cases:
        delta = compute_delta_yaw(target_b, dev_h)
        print(f"  Target: {target_b} deg, Heading: {dev_h} deg [{desc}]:")
        print(f"    Calculated Delta Yaw: {delta:+.1f} deg | Expected: {exp_delta:+.1f} deg")
        assert math.isclose(delta, exp_delta, abs_tol=1e-4), f"Failed wrap-around for {desc}: got {delta}"
        print(f"    [OK] PASS")

    print("\n[OK] ALL FRONTEND ARROW BEARING & DELTA MATH TESTS PASSED!\n")

if __name__ == "__main__":
    test_astar_5_cases()
    test_agent_multi_stop()
    test_frontend_arrow_math()
    print("=" * 60)
    print("ALL VERIFICATION TEST SUITES EXECUTED AND PASSED SUCCESSFULLY!")
    print("=" * 60)
