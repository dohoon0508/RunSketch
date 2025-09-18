import os
from dotenv import load_dotenv

load_dotenv()

# 카카오 API 키
KAKAO_REST_API_KEY = "dd5b7313c6b9a30381f068b74109751f"
KAKAO_JS_API_KEY = "7cbdf41cc871e4e93618b5dacbd82e28"

# API 설정
KAKAO_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions"
MAX_WAYPOINTS_PER_REQUEST = 3  # 카카오 API 경유지 제한
