import React from 'react';
import { LoopResponse } from '../types';
import { downloadGPX } from '../api';

interface RouteInfoProps {
  route: LoopResponse;
  onDownloadGPX: () => void;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ route, onDownloadGPX }) => {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const formatPace = (distance: number, duration: number) => {
    if (distance === 0 || duration === 0) return '-';
    
    const paceSeconds = duration / (distance / 1000); // 초/km
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
        📊 코스 정보
      </h3>
      
      {route.success ? (
        <>
          <div className="route-info">
            <div className="info-item">
              <div className="info-label">총 거리</div>
              <div className="info-value">{formatDistance(route.distance_m)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">예상 소요시간</div>
              <div className="info-value">{formatDuration(route.duration_s)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">평균 페이스</div>
              <div className="info-value">{formatPace(route.distance_m, route.duration_s)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">경유지 수</div>
              <div className="info-value">{route.waypoints.length}개</div>
            </div>
          </div>

          {route.message && (
            <div className="success" style={{ marginTop: '16px' }}>
              ✅ {route.message}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={onDownloadGPX}
              className="btn"
              style={{ flex: 1 }}
            >
              📥 GPX 다운로드
            </button>
            <button
              onClick={() => {
                const dataStr = JSON.stringify(route.geojson, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'route.geojson';
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              📄 GeoJSON 다운로드
            </button>
          </div>
        </>
      ) : (
        <div className="error">
          ❌ {route.message || '코스 생성에 실패했습니다.'}
        </div>
      )}
    </div>
  );
};

export default RouteInfo;
