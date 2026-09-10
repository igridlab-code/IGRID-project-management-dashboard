import datetime
import random
from typing import Dict, List, Any
from .models import WaypointStatus

POI_STATUS_TEMPLATES = {
    "main_block": {
        "statuses": ["Lectures in Session", "Active", "Open"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Lecture Halls",
        "metric_generator": lambda: "Smart Halls Active",
        "badge_color": "amber",
        "notes": "Main lecture theaters and dean's chambers open"
    },
    "cs_lab": {
        "statuses": ["Occupied", "Partially Free", "Lab Session In Progress"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Seat Occupancy",
        "metric_generator": lambda: f"{random.randint(24, 29)}/30 seats",
        "badge_color": "amber",
        "notes": "Computer Vision & Deep Learning practical session"
    },
    "robotics_lab": {
        "statuses": ["Open Access", "Maker Workshop"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "3D Printers",
        "metric_generator": lambda: f"{random.randint(4, 7)} machines free",
        "badge_color": "emerald",
        "notes": "Drone testing cage and rapid prototyping lab open"
    },
    "electronics_lab": {
        "statuses": ["Open", "Circuits Lab"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Lab Benches",
        "metric_generator": lambda: f"{random.randint(8, 14)} benches free",
        "badge_color": "sky",
        "notes": "Microcontroller programming & IoT hardware testing"
    },
    "biotech_lab": {
        "statuses": ["Sterilization Complete", "Open Access"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "Biosafety Bays",
        "metric_generator": lambda: "Bays 1-4 Available",
        "badge_color": "emerald",
        "notes": "Cleanroom hoods & chemistry analysis workstations"
    },
    "central_library": {
        "statuses": ["Quiet Zone", "Open"],
        "occupied": True,
        "queue_minutes": 2,
        "metric_label": "Study Pods Free",
        "metric_generator": lambda: f"{random.randint(14, 26)} pods free",
        "badge_color": "indigo",
        "notes": "Silent study floor 2 & digital media commons active"
    },
    "main_canteen": {
        "statuses": ["Busy", "Moderate", "Peak Lunch Rush"],
        "occupied": True,
        "queue_minutes": 7,
        "metric_label": "Queue Wait Time",
        "metric_generator": lambda: f"~{random.randint(4, 9)} min wait",
        "badge_color": "amber",
        "notes": "Main food counters & fresh juice bar active"
    },
    "auditorium": {
        "statuses": ["Sound Check", "Doors Open Soon"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "Next Event",
        "metric_generator": lambda: "Tech Summit @ 3:30 PM",
        "badge_color": "indigo",
        "notes": "1,200-seat grand auditorium preparing for keynote"
    },
    "boys_hostel_1": {
        "statuses": ["Resident Entry", "Quiet Hours"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Warden Reception",
        "metric_generator": lambda: "Active",
        "badge_color": "sky",
        "notes": "Aryabhatta Hall security check and recreation lounge"
    },
    "boys_hostel_2": {
        "statuses": ["Resident Entry", "Open"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Common Room",
        "metric_generator": lambda: "Open",
        "badge_color": "sky",
        "notes": "Kalam Hall study room & laundry annex active"
    },
    "girls_hostel": {
        "statuses": ["Secure Entry", "Resident Access"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Security Desk",
        "metric_generator": lambda: "Active",
        "badge_color": "sky",
        "notes": "Gargi Hall gated residential security active"
    },
    "admin_office": {
        "statuses": ["Open", "Office Hours"],
        "occupied": True,
        "queue_minutes": 4,
        "metric_label": "Registrar Window",
        "metric_generator": lambda: "Window 3 Open",
        "badge_color": "emerald",
        "notes": "Student services desk accepting document submissions"
    },
    "sports_complex": {
        "statuses": ["Open", "Gym & Courts"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Gym Capacity",
        "metric_generator": lambda: f"{random.randint(45, 65)}% capacity",
        "badge_color": "emerald",
        "notes": "Olympic pool & indoor basketball courts open"
    },
    "medical_center": {
        "statuses": ["Open 24/7", "Doctor Available"],
        "occupied": False,
        "queue_minutes": 3,
        "metric_label": "Triage Wait",
        "metric_generator": lambda: "< 5 min wait",
        "badge_color": "emerald",
        "notes": "Duty physician on call + campus pharmacy stocked"
    },
    "innovation_hub": {
        "statuses": ["Open Co-working", "Incubator"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "Pitch Room",
        "metric_generator": lambda: "Open for Startups",
        "badge_color": "indigo",
        "notes": "Incubator hot desks open for student teams"
    },
    "student_center": {
        "statuses": ["Lively", "Open Access"],
        "occupied": True,
        "queue_minutes": 0,
        "metric_label": "Recreation Lounge",
        "metric_generator": lambda: f"{random.randint(18, 32)} students inside",
        "badge_color": "emerald",
        "notes": "Student club meetups & music rehearsal rooms"
    },
    "coffee_kiosk": {
        "statuses": ["Quick Service", "Open"],
        "occupied": True,
        "queue_minutes": 2,
        "metric_label": "Pickup Wait",
        "metric_generator": lambda: f"{random.randint(1, 3)} min wait",
        "badge_color": "sky",
        "notes": "Artisan barista coffee & fresh bakery croissants"
    },
    "bank_atm": {
        "statuses": ["Operational", "Cash Available"],
        "occupied": False,
        "queue_minutes": 1,
        "metric_label": "ATM Kiosks",
        "metric_generator": lambda: "2/2 ATMs active",
        "badge_color": "emerald",
        "notes": "Zero transaction fees for student debit accounts"
    },
    "main_gate": {
        "statuses": ["Clear Flow", "Shuttle Arriving"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "Campus Shuttle",
        "metric_generator": lambda: "Every 5 min",
        "badge_color": "emerald",
        "notes": "Primary campus vehicle and visitor check"
    },
    "south_gate": {
        "statuses": ["Normal Flow", "Metro Active"],
        "occupied": False,
        "queue_minutes": 0,
        "metric_label": "Metro Trains",
        "metric_generator": lambda: "Every 4 min",
        "badge_color": "emerald",
        "notes": "Covered walkway to city rapid transit line"
    }
}

class StatusService:
    def __init__(self, campus_nodes: list):
        self.nodes = {node["id"]: node for node in campus_nodes}

    def get_status_for_node(self, node_id: str) -> WaypointStatus:
        node = self.nodes.get(node_id, {})
        name = node.get("name", node_id)
        
        template = POI_STATUS_TEMPLATES.get(node_id)
        if template:
            status = random.choice(template["statuses"])
            metric_val = template["metric_generator"]()
            occ = bool(node.get("occupied", template.get("occupied", False)))
            q_min = float(node.get("queue_minutes", template.get("queue_minutes", 0.0)))

            return WaypointStatus(
                node_id=node_id,
                name=name,
                status=status,
                occupied=occ,
                queue_minutes=q_min,
                metric_label=template["metric_label"],
                metric_value=metric_val,
                badge_color=template["badge_color"],
                notes=template["notes"]
            )
        
        # Default fallback
        return WaypointStatus(
            node_id=node_id,
            name=name,
            status="Open",
            occupied=bool(node.get("occupied", False)),
            queue_minutes=float(node.get("queue_minutes", 0.0)),
            metric_label="Status",
            metric_value="Accessible",
            badge_color="emerald",
            notes="Normal campus operations"
        )

    def get_all_statuses(self) -> Dict[str, WaypointStatus]:
        return {node_id: self.get_status_for_node(node_id) for node_id in self.nodes.keys()}
