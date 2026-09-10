import itertools
import os
import re
from typing import List, Optional, Tuple, Dict, Set
from .models import (
    CampusNode,
    AgentQueryRequest,
    AgentQueryResponse,
    RecognizedStop,
    RouteLeg,
    WaypointStep,
)
from .pathfinding import CampusPathfinder
from .status_service import StatusService

# Ambiguous keywords that require user clarification between multiple campus POIs
AMBIGUOUS_KEYWORDS = {
    "parking": {
        "question": "Did you mean North Visitor Parking A or South Staff Parking B?",
        "suggestions": ["parking_a", "parking_b"]
    },
    "car park": {
        "question": "Did you mean North Visitor Parking A or South Staff Parking B?",
        "suggestions": ["parking_a", "parking_b"]
    },
    "gate": {
        "question": "Did you mean Main Gate 1 (Front Entrance) or South Gate 2 (Metro Link)?",
        "suggestions": ["gate_1", "gate_2"]
    },
    "hostel": {
        "question": "Did you mean North Residence Hall (Boys) or South Residence Hall (Girls)?",
        "suggestions": ["boys_hostel", "girls_hostel"]
    },
    "dorm": {
        "question": "Did you mean North Residence Hall (Boys) or South Residence Hall (Girls)?",
        "suggestions": ["boys_hostel", "girls_hostel"]
    },
    "residence": {
        "question": "Did you mean North Residence Hall (Boys) or South Residence Hall (Girls)?",
        "suggestions": ["boys_hostel", "girls_hostel"]
    }
}

class CampusAgent:
    def __init__(self, pathfinder: CampusPathfinder, status_service: StatusService):
        self.pathfinder = pathfinder
        self.status_service = status_service
        self.nodes = pathfinder.nodes

    def check_ambiguity(self, query: str) -> Optional[Tuple[str, List[str]]]:
        """Check if query contains ambiguous terms without sufficient specificity."""
        q = query.lower().strip()

        # Check explicit disambiguations first
        if "parking a" in q or "parking b" in q or "visitor parking" in q or "staff parking" in q:
            return None
        if "gate 1" in q or "gate 2" in q or "main gate" in q or "south gate" in q or "metro gate" in q:
            return None
        if "boys" in q or "girls" in q or "north hostel" in q or "south hostel" in q:
            return None

        # Check for isolated ambiguous keywords
        for kw, data in AMBIGUOUS_KEYWORDS.items():
            if re.search(rf"\b{re.escape(kw)}\b", q):
                return data["question"], data["suggestions"]

        return None

    def resolve_stop_from_text(self, text: str) -> Optional[CampusNode]:
        cleaned = text.lower().strip()
        if not cleaned:
            return None

        # 1. Exact node id match
        if cleaned in self.nodes:
            return self.nodes[cleaned]

        cleaned_spaced = cleaned.replace("_", " ")

        # 2. Match against alias lists
        for node in self.nodes.values():
            for alias in node.aliases:
                alias_spaced = alias.replace("_", " ")
                if (alias == cleaned or alias_spaced == cleaned_spaced or 
                    re.search(rf"\b{re.escape(alias)}\b", cleaned_spaced) or
                    re.search(rf"\b{re.escape(alias_spaced)}\b", cleaned_spaced)):
                    return node

        # 3. Match against full node name
        for node in self.nodes.values():
            if node.name.lower() in cleaned_spaced or cleaned_spaced in node.name.lower():
                return node

        # 4. Keyword heuristics mapping
        keyword_mappings = [
            (["cs", "lab", "computer", "coding", "software", "ai", "python"], "cs_lab"),
            (["robotics", "maker", "3d print", "cnc"], "robotics_lab"),
            (["electronics", "circuits", "hardware", "iot", "eee"], "electronics_lab"),
            (["biotech", "chemistry", "biology", "science", "biosafety"], "biotech_lab"),
            (["canteen", "cafeteria", "lunch", "eat", "food", "dining", "meal", "snack"], "main_canteen"),
            (["coffee", "cafe", "espresso", "latte", "bakery"], "coffee_kiosk"),
            (["library", "books", "study", "quiet", "reading"], "central_library"),
            (["main block", "academic block", "classes", "lecture"], "main_block"),
            (["admin", "dean", "registrar", "office", "admission", "fees"], "admin_office"),
            (["gym", "sports", "fitness", "pool", "swim", "basketball", "workout"], "sports_complex"),
            (["doctor", "clinic", "hospital", "medicine", "medical", "pharmacy", "first aid"], "medical_center"),
            (["auditorium", "seminar", "keynote", "hall", "theater"], "auditorium"),
            (["innovation", "startup", "incubator", "venture"], "innovation_hub"),
            (["sac", "student center", "club", "lounge", "union"], "student_center"),
            (["atm", "bank", "cash", "money", "withdraw"], "bank_atm"),
            (["boys hostel 1", "north boys hostel", "aryabhatta"], "boys_hostel_1"),
            (["boys hostel 2", "west boys hostel", "kalam"], "boys_hostel_2"),
            (["girls hostel", "south girls hostel", "gargi", "women hostel"], "girls_hostel"),
            (["main gate", "gate 1", "front gate", "entrance"], "main_gate"),
            (["south gate", "gate 2", "metro gate", "subway", "metro"], "south_gate"),
        ]

        for keywords, target_id in keyword_mappings:
            if target_id not in self.nodes:
                continue
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", cleaned_spaced):
                    return self.nodes[target_id]

        return None

    def parse_query_destinations(self, query: str) -> List[CampusNode]:
        """
        Extract ordered list of destinations from query string.
        Handles delimiters like 'poi', 'then', 'after that', '->', commas, and spaces.
        """
        # Support "poi", "POI", "then", "after that", "->", semicolons, commas
        delimiter_pattern = r"\b(?:poi|then|after\s+that|followed\s+by|next|afterwards|and\s+then|and\s+finally|and\s+also|\->)\b|[;,\.\n]"
        raw_chunks = re.split(delimiter_pattern, query, flags=re.IGNORECASE)

        stops: List[CampusNode] = []
        seen_ids = set()

        for chunk in raw_chunks:
            chunk = chunk.strip()
            if not chunk:
                continue

            matched = self.resolve_stop_from_text(chunk)
            if matched and matched.id not in seen_ids:
                stops.append(matched)
                seen_ids.add(matched.id)

        # If delimiters like 'poi' or 'then' were not used, try splitting along "and" / "&"
        if len(stops) <= 1:
            and_chunks = re.split(r"\b(?:and|&)\b", query, flags=re.IGNORECASE)
            if len(and_chunks) > 1:
                alt_stops: List[CampusNode] = []
                alt_seen = set()
                for chunk in and_chunks:
                    matched = self.resolve_stop_from_text(chunk)
                    if matched and matched.id not in alt_seen:
                        alt_stops.append(matched)
                        alt_seen.add(matched.id)
                if len(alt_stops) > len(stops):
                    stops = alt_stops

        # If still single or none, test word tokens against known POIs
        if len(stops) <= 1:
            tokens = [t.strip() for t in query.split() if len(t.strip()) > 2]
            token_stops: List[CampusNode] = []
            token_seen = set()
            for token in tokens:
                if token.lower() in ["poi", "the", "and", "then", "from", "with", "near"]:
                    continue
                matched = self.resolve_stop_from_text(token)
                if matched and matched.id not in token_seen:
                    token_stops.append(matched)
                    token_seen.add(matched.id)
            if len(token_stops) > len(stops):
                stops = token_stops

        return stops

    def optimize_multi_stop_sequence(self, start_node_id: str, stops: List[CampusNode]) -> List[CampusNode]:
        """
        Calculates the optimal sequence of stops that minimizes total walking distance.
        Uses permutation search for <= 6 stops, or greedy nearest-neighbor for larger sets.
        """
        if len(stops) <= 1:
            return stops

        # For typical 2-6 stops, evaluate all permutations for exact global optimum
        if len(stops) <= 6:
            best_order = list(stops)
            min_dist = float('inf')

            for perm in itertools.permutations(stops):
                curr_dist = 0.0
                prev_id = start_node_id
                valid = True

                for stop in perm:
                    _, d = self.pathfinder.find_shortest_path(prev_id, stop.id)
                    if d == float('inf'):
                        valid = False
                        break
                    curr_dist += d
                    prev_id = stop.id

                if valid and curr_dist < min_dist:
                    min_dist = curr_dist
                    best_order = list(perm)

            return best_order

        # Greedy nearest neighbor heuristic fallback
        remaining = list(stops)
        optimized = []
        curr_id = start_node_id

        while remaining:
            best_next = None
            best_d = float('inf')
            for candidate in remaining:
                _, d = self.pathfinder.find_shortest_path(curr_id, candidate.id)
                if d < best_d:
                    best_d = d
                    best_next = candidate
            optimized.append(best_next)
            remaining.remove(best_next)
            curr_id = best_next.id

        return optimized

    def process_query(self, req: AgentQueryRequest) -> AgentQueryResponse:
        query_text = req.query.strip()
        current_node_id = req.current_node_id
        if not current_node_id or current_node_id not in self.nodes:
            matched_curr = self.resolve_stop_from_text(current_node_id or "")
            if matched_curr:
                current_node_id = matched_curr.id
            else:
                current_node_id = "main_gate" if "main_gate" in self.nodes else list(self.nodes.keys())[0]

        # 1. Check for ambiguous query terms (e.g., "parking", "gate", "hostel")
        ambiguity = self.check_ambiguity(query_text)
        if ambiguity:
            question, suggestions = ambiguity
            return AgentQueryResponse(
                success=False,
                query=query_text,
                clarification_needed=True,
                clarification_question=question,
                suggestions=suggestions,
                recognized_stops=[],
                optimized_sequence=[],
                legs=[],
                total_stops=0,
                total_distance_meters=0.0,
                combined_waypoints=[],
                agent_summary=f"Clarification needed: {question}",
                message="Ambiguous destination in query"
            )

        # 2. Extract POIs from query (supporting 'poi' delimiters, 'then', commas, etc.)
        dest_nodes = self.parse_query_destinations(query_text)
        if not dest_nodes:
            return AgentQueryResponse(
                success=False,
                query=query_text,
                clarification_needed=True,
                clarification_question="I couldn't identify any known campus buildings or labs from your query. Did you mean the CS Lab, Central Library, or Canteen?",
                suggestions=["cs_lab", "central_library", "main_canteen"],
                recognized_stops=[],
                optimized_sequence=[],
                legs=[],
                total_stops=0,
                total_distance_meters=0.0,
                combined_waypoints=[],
                agent_summary="Unrecognized destination. Please specify a campus building, lab, or POI.",
                message="No recognized destinations found"
            )

        # 3. Optimize multi-stop sequence to minimize total path distance
        optimized_stops = self.optimize_multi_stop_sequence(current_node_id, dest_nodes)

        legs: List[RouteLeg] = []
        combined_waypoints: List[WaypointStep] = []
        total_distance = 0.0

        leg_start_id = current_node_id
        step_counter = 1

        for idx, dest_node in enumerate(optimized_stops):
            leg_res = self.pathfinder.get_route(
                leg_start_id,
                dest_node.id,
                accessible_only=False,
                status_service=self.status_service
            )

            if not leg_res.success:
                continue

            leg_waypoints = leg_res.waypoints
            legs.append(RouteLeg(
                leg_index=idx + 1,
                from_node=leg_start_id,
                to_node=dest_node.id,
                distance_meters=leg_res.total_distance_meters,
                waypoints=leg_waypoints
            ))

            total_distance += leg_res.total_distance_meters

            # Append to combined waypoints, avoiding duplicate joining node
            for w_idx, wp in enumerate(leg_waypoints):
                if combined_waypoints and w_idx == 0:
                    continue

                new_wp = wp.model_copy()
                new_wp.step_number = step_counter
                step_counter += 1
                combined_waypoints.append(new_wp)

            leg_start_id = dest_node.id

        # 4. Generate intelligent summary highlighting sequence and live status
        stop_names = [n.name for n in optimized_stops]
        status_notes = []
        for n in optimized_stops:
            st = self.status_service.get_status_for_node(n.id)
            status_notes.append(f"{n.name} ({st.status}: {st.metric_value})")

        start_name = self.nodes[current_node_id].name
        if len(stop_names) == 1:
            summary = (
                f"Mapped direct route from {start_name} to {stop_names[0]} ({int(total_distance)}m). "
                f"Status: {status_notes[0]}."
            )
        else:
            joined_sequence = " -> ".join(stop_names)
            summary = (
                f"Optimized {len(stop_names)}-stop sequence: {joined_sequence}. "
                f"Total distance: {int(total_distance)}m (~{max(1, int(total_distance / 75))} min walk). "
                f"Live status: " + "; ".join(status_notes) + "."
            )

        return AgentQueryResponse(
            success=True,
            query=query_text,
            clarification_needed=False,
            clarification_question=None,
            suggestions=[],
            recognized_stops=[
                RecognizedStop(id=n.id, name=n.name, category=n.category)
                for n in dest_nodes
            ],
            optimized_sequence=[n.id for n in optimized_stops],
            legs=legs,
            total_stops=len(optimized_stops),
            total_distance_meters=round(total_distance, 1),
            combined_waypoints=combined_waypoints,
            agent_summary=summary
        )

def test_agent_parser():
    import json
    data_path = os.path.join(os.path.dirname(__file__), "campus_data.json")
    with open(data_path, "r") as f:
        campus_data = json.load(f)

    pf = CampusPathfinder(campus_data)
    ss = StatusService(campus_data["nodes"])
    agent = CampusAgent(pf, ss)

    # 1. Test "poi" delimiter pattern
    q1 = "lab poi canteen poi library"
    r1 = agent.process_query(AgentQueryRequest(query=q1, current_node_id="gate_1"))
    print(f"Test 1: '{q1}'")
    print(f"  Recognized stops: {[s.name for s in r1.recognized_stops]}")
    print(f"  Optimized sequence: {r1.optimized_sequence}")
    print(f"  Total distance: {r1.total_distance_meters}m")
    assert r1.success is True
    assert len(r1.recognized_stops) == 3
    assert r1.clarification_needed is False

    # 2. Test natural sequence query
    q2 = "workout at the gym and then grab lunch"
    r2 = agent.process_query(AgentQueryRequest(query=q2, current_node_id="gate_1"))
    print(f"\nTest 2: '{q2}'")
    print(f"  Recognized stops: {[s.name for s in r2.recognized_stops]}")
    assert r2.success is True
    assert len(r2.recognized_stops) == 2

    # 3. Test ambiguous query triggering clarification question
    q3 = "take me to parking"
    r3 = agent.process_query(AgentQueryRequest(query=q3, current_node_id="gate_1"))
    print(f"\nTest 3: '{q3}' (Ambiguity test)")
    print(f"  Clarification needed: {r3.clarification_needed}")
    print(f"  Clarification question: {r3.clarification_question}")
    print(f"  Suggestions: {r3.suggestions}")
    assert r3.success is False
    assert r3.clarification_needed is True
    assert "Parking A" in r3.clarification_question

    # 4. Test unrecognized query triggering clarification question
    q4 = "where is the starbucks coffee shop?"
    r4 = agent.process_query(AgentQueryRequest(query=q4, current_node_id="gate_1"))
    print(f"\nTest 4: '{q4}' (Coffee alias)")
    print(f"  Recognized stops: {[s.name for s in r4.recognized_stops]}")
    # "coffee" keyword resolves to coffee_kiosk
    assert r4.success is True

    print("\nAll Agent unit tests passed successfully!")
