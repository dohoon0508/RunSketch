import math
import httpx
import json
import base64
from typing import List, Tuple, Dict, Any, Optional
from models import Coordinate, RouteSegment, LoopResponse
from config import KAKAO_REST_API_KEY, KAKAO_DIRECTIONS_URL, MAX_WAYPOINTS_PER_REQUEST

class KakaoRouter:
    def __init__(self):
        self.api_key = KAKAO_REST_API_KEY
        self.base_url = KAKAO_DIRECTIONS_URL
        self.headers = {
            "Authorization": f"KakaoAK {self.api_key}",
            "Content-Type": "application/json"
        }

    def generate_waypoints(self, center: Tuple[float, float], radius_m: float, count: int = 16) -> List[Tuple[float, float]]:
        """시작점을 중심으로 원형으로 경유지 후보들을 생성"""
        lat, lon = center
        # 위도 1도 ≈ 111,320m, 경도 1도 ≈ 111,320 * cos(위도) m
        lat_m = 111320
        lon_m = 111320 * math.cos(math.radians(lat))
        
        waypoints = []
        for i in range(count):
            angle = 2 * math.pi * i / count
            # 반지름 내에서 랜덤한 거리 (0.7 ~ 1.0 사이)
            random_radius = radius_m * (0.7 + 0.3 * (i % 3) / 2)
            
            delta_lat = (random_radius * math.sin(angle)) / lat_m
            delta_lon = (random_radius * math.cos(angle)) / lon_m
            
            waypoints.append((lat + delta_lat, lon + delta_lon))
        
        return waypoints

    async def get_directions(self, origin: Tuple[float, float], destination: Tuple[float, float], 
                           waypoints: List[Tuple[float, float]] = None) -> Dict[str, Any]:
        """카카오 Directions API 호출"""
        url = f"{self.base_url}"
        
        # 경유지가 너무 많으면 분할해서 처리
        if waypoints and len(waypoints) > MAX_WAYPOINTS_PER_REQUEST:
            return await self._get_directions_with_chunking(origin, destination, waypoints)
        
        payload = {
            "origin": {
                "x": origin[1],  # 경도
                "y": origin[0]   # 위도
            },
            "destination": {
                "x": destination[1],
                "y": destination[0]
            }
        }
        
        if waypoints:
            payload["waypoints"] = [
                {"x": wp[1], "y": wp[0]} for wp in waypoints
            ]
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers, json=payload)
                print(f"카카오 API 응답 상태: {response.status_code}")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"API 오류: {response.text}")
                    return None
            except Exception as e:
                print(f"API 호출 오류: {e}")
                return None

    async def _get_directions_with_chunking(self, origin: Tuple[float, float], 
                                          destination: Tuple[float, float], 
                                          waypoints: List[Tuple[float, float]]) -> Dict[str, Any]:
        """경유지를 청크로 나누어 여러 번 API 호출"""
        all_coordinates = []
        total_distance = 0
        total_duration = 0
        
        # 경유지를 청크로 분할
        chunks = [waypoints[i:i + MAX_WAYPOINTS_PER_REQUEST] 
                 for i in range(0, len(waypoints), MAX_WAYPOINTS_PER_REQUEST)]
        
        current_origin = origin
        
        for i, chunk in enumerate(chunks):
            # 마지막 청크가 아니면 다음 청크의 첫 번째 점을 목적지로
            if i < len(chunks) - 1:
                next_chunk_start = chunks[i + 1][0]
                dest = next_chunk_start
            else:
                dest = destination
            
            result = await self.get_directions(current_origin, dest, chunk)
            
            if result and "routes" in result and result["routes"]:
                route = result["routes"][0]
                total_distance += route["summary"]["distance"]
                total_duration += route["summary"]["duration"]
                
                # 좌표 추출
                for section in route["sections"]:
                    for road in section["roads"]:
                        for vertex in road["vertexes"]:
                            # vertexes는 [x1, y1, x2, y2, ...] 형태
                            for j in range(0, len(vertex), 2):
                                if j + 1 < len(vertex):
                                    all_coordinates.append((vertex[j+1], vertex[j]))  # (lat, lon)
            
            # 다음 구간의 시작점 업데이트
            if chunk:
                current_origin = chunk[-1]
        
        # 결과 합치기
        return {
            "routes": [{
                "summary": {
                    "distance": total_distance,
                    "duration": total_duration
                },
                "sections": [{
                    "roads": [{
                        "vertexes": self._coordinates_to_vertexes(all_coordinates)
                    }]
                }]
            }]
        }

    def _coordinates_to_vertexes(self, coordinates: List[Tuple[float, float]]) -> List[float]:
        """좌표 리스트를 카카오 API vertexes 형식으로 변환"""
        vertexes = []
        for lat, lon in coordinates:
            vertexes.extend([lon, lat])  # [x, y, x, y, ...]
        return vertexes

    async def find_loop_route(self, start: Tuple[float, float], target_km: float, 
                            mode: str = "walk", max_iterations: int = 3) -> LoopResponse:
        """목표 거리에 맞는 루프 경로 탐색"""
        target_m = target_km * 1000
        best_route = None
        best_error = float('inf')
        
        # 초기 반지름 추정 (경험값: 목표 거리의 45%)
        radius = target_m * 0.45
        
        for iteration in range(max_iterations):
            print(f"반복 {iteration + 1}: 반지름 {radius:.0f}m로 탐색 중...")
            
            # 경유지 생성
            waypoints = self.generate_waypoints(start, radius, 12)
            
            # 루프 경로 계산 (시작점 → 경유지들 → 시작점)
            result = await self.get_directions(start, start, waypoints)
            
            if result and "routes" in result and result["routes"]:
                route = result["routes"][0]
                distance = route["summary"]["distance"]
                duration = route["summary"]["duration"]
                
                error = abs(distance - target_m)
                print(f"  거리: {distance}m, 목표: {target_m}m, 오차: {error}m")
                
                if error < best_error:
                    best_error = error
                    best_route = {
                        "distance": distance,
                        "duration": duration,
                        "coordinates": self._extract_coordinates(result),
                        "waypoints": waypoints
                    }
                
                # 반지름 조정 (거리가 목표보다 짧으면 반지름 증가, 길면 감소)
                if distance < target_m:
                    radius *= 1.1
                else:
                    radius *= 0.9
            else:
                print(f"  API 호출 실패")
                radius *= 1.1  # 실패시 반지름 증가
        
        if best_route:
            # GeoJSON과 GPX 생성
            geojson = self._create_geojson(best_route["coordinates"])
            gpx = self._create_gpx(best_route["coordinates"])
            
            return LoopResponse(
                distance_m=best_route["distance"],
                duration_s=best_route["duration"],
                geojson=geojson,
                gpx=gpx,
                waypoints=[Coordinate(lat=wp[0], lon=wp[1]) for wp in best_route["waypoints"]],
                success=True,
                message=f"루프 코스 생성 완료 (오차: {best_error:.0f}m)"
            )
        else:
            return LoopResponse(
                distance_m=0,
                duration_s=0,
                geojson={},
                gpx="",
                waypoints=[],
                success=False,
                message="루프 코스를 찾을 수 없습니다"
            )

    def _extract_coordinates(self, api_result: Dict[str, Any]) -> List[Tuple[float, float]]:
        """API 결과에서 좌표 추출"""
        coordinates = []
        
        if "routes" in api_result and api_result["routes"]:
            route = api_result["routes"][0]
            
            for section in route["sections"]:
                for road in section["roads"]:
                    vertexes = road["vertexes"]
                    # vertexes는 [x1, y1, x2, y2, ...] 형태
                    for i in range(0, len(vertexes), 2):
                        if i + 1 < len(vertexes):
                            coordinates.append((vertexes[i+1], vertexes[i]))  # (lat, lon)
        
        return coordinates

    def _create_geojson(self, coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
        """좌표 리스트를 GeoJSON LineString으로 변환"""
        return {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Running Loop Route"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[coord[1], coord[0]] for coord in coordinates]  # [lon, lat]
                }
            }]
        }

    def _create_gpx(self, coordinates: List[Tuple[float, float]]) -> str:
        """좌표 리스트를 GPX 형식으로 변환"""
        gpx_content = '''<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Running Loop Generator">
  <trk>
    <name>Running Loop Route</name>
    <trkseg>'''
        
        for lat, lon in coordinates:
            gpx_content += f'''
      <trkpt lat="{lat}" lon="{lon}"></trkpt>'''
        
        gpx_content += '''
    </trkseg>
  </trk>
</gpx>'''
        
        return base64.b64encode(gpx_content.encode('utf-8')).decode('utf-8')
