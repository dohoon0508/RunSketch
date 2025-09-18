import React, { useState } from 'react';
import { Coordinate, LoopRequest } from '../types';

interface RouteFormProps {
  onGenerateRoute: (request: LoopRequest) => void;
  loading: boolean;
  currentLocation?: Coordinate;
}

const RouteForm: React.FC<RouteFormProps> = ({ 
  onGenerateRoute, 
  loading, 
  currentLocation 
}) => {
  const [formData, setFormData] = useState({
    lat: currentLocation?.lat || 37.5665,
    lon: currentLocation?.lon || 126.9780,
    target_km: 3.0,
    mode: 'walk' as 'walk' | 'bike' | 'car',
    elev_avoid: false,
    max_turns: 120,
    avoid_highways: true,
    prefer_bikepaths: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: LoopRequest = {
      start: {
        lat: formData.lat,
        lon: formData.lon
      },
      target_km: formData.target_km,
      mode: formData.mode,
      constraints: {
        elev_avoid: formData.elev_avoid,
        max_turns: formData.max_turns,
        avoid_highways: formData.avoid_highways,
        prefer_bikepaths: formData.prefer_bikepaths
      }
    };

    onGenerateRoute(request);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }));
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          alert('위치 정보를 가져올 수 없습니다. 수동으로 입력해주세요.');
        }
      );
    } else {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#333' }}>
        🏃‍♂️ 런닝 코스 생성기
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">시작점 위도</label>
            <input
              type="number"
              name="lat"
              value={formData.lat}
              onChange={handleInputChange}
              className="form-input"
              step="0.000001"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">시작점 경도</label>
            <input
              type="number"
              name="lon"
              value={formData.lon}
              onChange={handleInputChange}
              className="form-input"
              step="0.000001"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="btn btn-secondary"
            style={{ marginBottom: '16px' }}
          >
            📍 현재 위치 사용
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">목표 거리 (km)</label>
            <input
              type="number"
              name="target_km"
              value={formData.target_km}
              onChange={handleInputChange}
              className="form-input"
              min="1"
              max="20"
              step="0.5"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">이동 모드</label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="walk">🚶‍♂️ 도보</option>
              <option value="bike">🚴‍♂️ 자전거</option>
              <option value="car">🚗 자동차</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">추가 옵션</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="elev_avoid"
                checked={formData.elev_avoid}
                onChange={handleInputChange}
              />
              오르막 회피
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="avoid_highways"
                checked={formData.avoid_highways}
                onChange={handleInputChange}
              />
              고속도로 회피
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="prefer_bikepaths"
                checked={formData.prefer_bikepaths}
                onChange={handleInputChange}
              />
              자전거도로 우선
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {loading ? '🔄 코스 생성 중...' : '🎯 루프 코스 생성'}
        </button>
      </form>
    </div>
  );
};

export default RouteForm;
