import urllib.request
import json
import sys

def test_api():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Health
    with urllib.request.urlopen(f"{base_url}/api/health") as res:
        health = json.loads(res.read().decode('utf-8'))
        print("1. Health Check:", health["status"], "| Campus:", health["campus"])
        assert health["status"] == "healthy"
        assert health["total_nodes"] == 20

    # 2. Campus Data (20 nodes, edges)
    with urllib.request.urlopen(f"{base_url}/api/campus/data") as res:
        data = json.loads(res.read().decode('utf-8'))
        print(f"2. Campus Data: {len(data['nodes'])} nodes, {len(data['edges'])} edges")
        assert len(data["nodes"]) == 20
        assert len(data["edges"]) >= 20

    # 3. Live Waypoint Status
    with urllib.request.urlopen(f"{base_url}/api/campus/status") as res:
        statuses = json.loads(res.read().decode('utf-8'))
        cs_st = statuses["statuses"]["cs_lab"]
        canteen_st = statuses["statuses"]["main_canteen"]
        print(f"3. Live Status: CS Lab = {cs_st['status']} ({cs_st['metric_value']}) | Canteen = {canteen_st['status']} ({canteen_st['metric_value']})")
        assert "seats" in cs_st["metric_value"]
        assert "min wait" in canteen_st["metric_value"]

    # 4. A* Route: Gate 1 -> CS Lab
    req_body = json.dumps({"start_node_id": "gate_1", "destination_node_id": "cs_lab"}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/api/route", data=req_body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        route = json.loads(res.read().decode('utf-8'))
        print(f"4. A* Route: Found={route['success']} | Distance={route['total_distance_meters']}m | Steps={len(route['waypoints'])}")
        assert route["success"] is True
        assert len(route["waypoints"]) == 4

    # 5. POST /agent/query with "lab poi canteen poi library"
    agent_body1 = json.dumps({"query": "lab poi canteen poi library", "current_node_id": "gate_1"}).encode("utf-8")
    req1 = urllib.request.Request(f"{base_url}/agent/query", data=agent_body1, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req1) as res:
        agent_resp1 = json.loads(res.read().decode('utf-8'))
        stops1 = [s["name"] for s in agent_resp1["recognized_stops"]]
        print(f"5. Agent Query 'lab poi canteen poi library': Recognized {len(stops1)} stops: {stops1}")
        print(f"   Optimized Sequence: {agent_resp1['optimized_sequence']}")
        print(f"   Total distance: {agent_resp1['total_distance_meters']}m")
        assert agent_resp1["success"] is True
        assert agent_resp1["clarification_needed"] is False
        assert len(stops1) == 3
        assert agent_resp1["optimized_sequence"] == ["cs_lab", "central_library", "main_canteen"]

    # 6. POST /agent/query with ambiguous query "take me to parking" (Clarification check)
    agent_body2 = json.dumps({"query": "take me to parking", "current_node_id": "gate_1"}).encode("utf-8")
    req2 = urllib.request.Request(f"{base_url}/agent/query", data=agent_body2, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req2) as res:
        agent_resp2 = json.loads(res.read().decode('utf-8'))
        print(f"6. Agent Clarification Test 'take me to parking':")
        print(f"   Clarification needed: {agent_resp2['clarification_needed']}")
        print(f"   Clarification question: {agent_resp2['clarification_question']}")
        print(f"   Suggestions: {agent_resp2['suggestions']}")
        assert agent_resp2["success"] is False
        assert agent_resp2["clarification_needed"] is True
        assert "Parking A" in agent_resp2["clarification_question"]
        assert "parking_a" in agent_resp2["suggestions"]

    # 7. Static Frontend Delivery
    with urllib.request.urlopen(f"{base_url}/") as res:
        html = res.read().decode('utf-8')
        assert "CampusAR Navigator" in html
        assert "camera-feed" in html
        assert "ar-canvas" in html
        print("7. Frontend Delivery: index.html served with Three.js, camera feed, and HUD.")

    # 8. Static Assets
    with urllib.request.urlopen(f"{base_url}/static/style.css") as res:
        css = res.read().decode('utf-8')
        assert "#ar-canvas" in css
        print("8. Static CSS Delivery: style.css served successfully.")

    with urllib.request.urlopen(f"{base_url}/static/ar-view.js") as res:
        ar_js = res.read().decode('utf-8')
        assert "class ARView" in ar_js
        print("9. Static AR View JS: ar-view.js served successfully.")

    with urllib.request.urlopen(f"{base_url}/static/app.js") as res:
        app_js = res.read().decode('utf-8')
        assert "class CampusARApp" in app_js
        print("10. Static App JS: app.js served successfully.")

    print("\nALL 10 END-TO-END VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    test_api()
