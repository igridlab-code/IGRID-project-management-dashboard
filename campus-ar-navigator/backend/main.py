import json
import os
from datetime import datetime
from typing import Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .models import (
    CampusDataResponse,
    CampusStatusResponse,
    RouteRequest,
    RouteResponse,
    AgentQueryRequest,
    AgentQueryResponse,
)
from .pathfinding import CampusPathfinder
from .status_service import StatusService
from .agent import CampusAgent

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "campus_data.json")
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    CAMPUS_DATA = json.load(f)

pathfinder = CampusPathfinder(CAMPUS_DATA)
status_service = StatusService(CAMPUS_DATA["nodes"])
campus_agent = CampusAgent(pathfinder, status_service)

app = FastAPI(
    title="CampusAR Navigator Backend",
    version="1.0.0",
    description="WebAR Campus Navigation System with AI Agent Layer and Live POI Status Tracking"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "campus": CAMPUS_DATA.get("campus_name"),
        "total_nodes": len(CAMPUS_DATA.get("nodes", [])),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/campus/data", response_model=CampusDataResponse)
def get_campus_data():
    return CampusDataResponse(**CAMPUS_DATA)

@app.get("/api/campus/status", response_model=CampusStatusResponse)
def get_campus_status():
    statuses = status_service.get_all_statuses()
    return CampusStatusResponse(
        timestamp=datetime.utcnow().isoformat() + "Z",
        statuses=statuses
    )

@app.post("/api/route", response_model=RouteResponse)
def calculate_route(req: RouteRequest):
    start_id = req.start_node_id
    dest_id = req.destination_node_id

    if start_id not in pathfinder.nodes:
        matched_start = campus_agent.resolve_stop_from_text(start_id)
        if matched_start:
            start_id = matched_start.id
        else:
            raise HTTPException(status_code=400, detail=f"Invalid start_node_id: '{req.start_node_id}'")

    if dest_id not in pathfinder.nodes:
        matched_dest = campus_agent.resolve_stop_from_text(dest_id)
        if matched_dest:
            dest_id = matched_dest.id
        else:
            raise HTTPException(status_code=400, detail=f"Invalid destination_node_id: '{req.destination_node_id}'")

    res = pathfinder.get_route(
        start_id=start_id,
        dest_id=dest_id,
        accessible_only=req.accessible_only,
        status_service=status_service
    )
    return res

@app.post("/agent/query", response_model=AgentQueryResponse)
@app.post("/api/agent/query", response_model=AgentQueryResponse)
@app.post("/api/agent/navigate", response_model=AgentQueryResponse)
def agent_query_endpoint(req: AgentQueryRequest):
    res = campus_agent.process_query(req)
    return res

# Mount static frontend directory if it exists
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend_root():
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend index.html not found"}
