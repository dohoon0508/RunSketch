from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class RouteMode(str, Enum):
    WALK = "walk"
    BIKE = "bike"
    CAR = "car"

class Constraints(BaseModel):
    elev_avoid: bool = False
    max_turns: int = 120
    avoid_highways: bool = True
    prefer_bikepaths: bool = False

class LoopRequest(BaseModel):
    start: Dict[str, float]  # {"lat": 35.82475, "lon": 127.14789}
    target_km: float
    mode: RouteMode = RouteMode.WALK
    constraints: Optional[Constraints] = None

class Coordinate(BaseModel):
    lat: float
    lon: float

class RouteSegment(BaseModel):
    distance: int  # 미터
    duration: int  # 초
    coordinates: List[Coordinate]

class LoopResponse(BaseModel):
    distance_m: int
    duration_s: int
    geojson: Dict[str, Any]
    gpx: str  # base64 encoded
    waypoints: List[Coordinate]
    success: bool
    message: Optional[str] = None
