import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import RouteForm from './components/RouteForm';
import RouteInfo from './components/RouteInfo';
import { generateLoopRoute, downloadGPX } from './api';
import { LoopRequest, LoopResponse, Coordinate } from './types';
import './App.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<LoopResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);

  // 현재 위치 가져오기
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('위치 정보를 가져올 수 없습니다:', error);
        }
      );
    }
  }, []);

  const handleGenerateRoute = async (request: LoopRequest) => {
    setLoading(true);
    setError(null);
    setRoute(null);

    try {
      console.log('루프 코스 생성 요청:', request);
      const result = await generateLoopRoute(request);
      console.log('루프 코스 생성 결과:', result);
      setRoute(result);
    } catch (err: any) {
      console.error('코스 생성 오류:', err);
      setError(err.response?.data?.detail || err.message || '코스 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (coordinate: Coordinate) => {
    // 지도 클릭 시 시작점 업데이트 (선택사항)
    console.log('지도 클릭 좌표:', coordinate);
  };

  const handleDownloadGPX = () => {
    if (route?.gpx) {
      try {
        downloadGPX(route.gpx, 'running-loop-route.gpx');
      } catch (err) {
        console.error('GPX 다운로드 오류:', err);
        setError('GPX 파일 다운로드 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#333', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🏃‍♂️ Running Loop Generator
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>
          목표 거리에 맞춰 자동으로 루프 런닝 코스를 생성해보세요!
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <RouteForm
          onGenerateRoute={handleGenerateRoute}
          loading={loading}
          currentLocation={currentLocation || undefined}
        />
        
        {route && (
          <RouteInfo
            route={route}
            onDownloadGPX={handleDownloadGPX}
          />
        )}
      </div>

      {error && (
        <div className="error">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
            <div>루프 코스를 생성하고 있습니다...</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              카카오 Directions API를 사용하여 최적의 경로를 찾고 있어요
            </div>
          </div>
        </div>
      )}

      {route && route.success && (
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
            🗺️ 생성된 루프 코스
          </h3>
          <MapComponent
            center={{
              lat: route.waypoints[0]?.lat || 37.5665,
              lon: route.waypoints[0]?.lon || 126.9780
            }}
            route={route.geojson}
            waypoints={route.waypoints}
            onMapClick={handleMapClick}
            height="600px"
          />
        </div>
      )}

      <footer style={{ 
        textAlign: 'center', 
        marginTop: '48px', 
        padding: '24px', 
        color: '#666',
        borderTop: '1px solid #eee'
      }}>
        <p>
          🏃‍♂️ Running Loop Generator | 
          카카오 Directions API를 활용한 스마트 런닝 코스 생성기
        </p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          GPX 파일을 다운로드하여 러닝 워치나 앱에서 사용하세요!
        </p>
      </footer>
    </div>
  );
};

export default App;
