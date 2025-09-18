from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from models import LoopRequest, LoopResponse
from routing_fixed import KakaoRouter

app = FastAPI(
    title="Running Loop Generator API",
    description="목표 거리에 맞춰 자동으로 루프 런닝 코스를 생성하는 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 인스턴스
router = KakaoRouter()

@app.get("/")
async def root():
    return {"message": "Running Loop Generator API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "running-loop-generator"}

@app.post("/api/loop", response_model=LoopResponse)
async def generate_loop_route(request: LoopRequest):
    """
    목표 거리에 맞는 루프 런닝 코스를 생성합니다.
    
    - **start**: 시작점 좌표 (lat, lon)
    - **target_km**: 목표 거리 (킬로미터)
    - **mode**: 경로 모드 (walk, bike, car)
    - **constraints**: 추가 제약 조건
    """
    try:
        # 요청 데이터 검증
        if not request.start or "lat" not in request.start or "lon" not in request.start:
            raise HTTPException(status_code=400, detail="시작점 좌표가 올바르지 않습니다")
        
        if request.target_km <= 0 or request.target_km > 50:
            raise HTTPException(status_code=400, detail="목표 거리는 0~50km 사이여야 합니다")
        
        start_coord = (request.start["lat"], request.start["lon"])
        
        print(f"루프 코스 생성 요청: 시작점={start_coord}, 목표거리={request.target_km}km")
        
        # 루프 경로 생성
        result = await router.find_loop_route(
            start=start_coord,
            target_km=request.target_km,
            mode=request.mode.value,
            max_iterations=3
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)
        
        print(f"루프 코스 생성 완료: 거리={result.distance_m}m, 소요시간={result.duration_s}초")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"루프 코스 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.get("/api/waypoints/{lat}/{lon}/{radius}")
async def get_waypoints(lat: float, lon: float, radius: float):
    """
    특정 위치와 반지름으로 경유지 후보들을 생성합니다.
    (디버깅 및 테스트용)
    """
    try:
        waypoints = router.generate_waypoints((lat, lon), radius, 16)
        return {
            "center": {"lat": lat, "lon": lon},
            "radius": radius,
            "waypoints": [{"lat": wp[0], "lon": wp[1]} for wp in waypoints]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"경유지 생성 오류: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
