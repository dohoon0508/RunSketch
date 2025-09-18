import React, { useEffect, useRef, useState } from 'react';
import { Coordinate } from '../types';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapComponentProps {
  center: Coordinate;
  route?: any; // GeoJSON
  waypoints?: Coordinate[];
  onMapClick?: (coordinate: Coordinate) => void;
  height?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  route,
  waypoints = [],
  onMapClick,
  height = '500px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [polylines, setPolylines] = useState<any[]>([]);

  // 카카오맵 초기화
  useEffect(() => {
    if (!window.kakao || !mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lon),
      level: 3
    };

    const kakaoMap = new window.kakao.maps.Map(mapRef.current, options);
    setMap(kakaoMap);

    // 지도 클릭 이벤트
    if (onMapClick) {
      window.kakao.maps.event.addListener(kakaoMap, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        onMapClick({
          lat: latlng.getLat(),
          lon: latlng.getLng()
        });
      });
    }
  }, [center, onMapClick]);

  // 경로 표시
  useEffect(() => {
    if (!map || !route) return;

    // 기존 폴리라인 제거
    polylines.forEach(polyline => polyline.setMap(null));
    setPolylines([]);

    // GeoJSON에서 좌표 추출
    if (route.features && route.features.length > 0) {
      const coordinates = route.features[0].geometry.coordinates;
      
      // 카카오맵 좌표로 변환
      const path = coordinates.map((coord: [number, number]) => 
        new window.kakao.maps.LatLng(coord[1], coord[0])
      );

      // 폴리라인 생성
      const polyline = new window.kakao.maps.Polyline({
        path: path,
        strokeWeight: 5,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      });

      polyline.setMap(map);
      setPolylines([polyline]);

      // 경로에 맞춰 지도 범위 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      path.forEach((point: any) => bounds.extend(point));
      map.setBounds(bounds);
    }
  }, [map, route]);

  // 경유지 마커 표시
  useEffect(() => {
    if (!map || waypoints.length === 0) return;

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: any[] = [];

    waypoints.forEach((waypoint, index) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(waypoint.lat, waypoint.lon),
        title: `경유지 ${index + 1}`
      });

      // 마커 클릭 시 정보창 표시
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding: 5px;">경유지 ${index + 1}</div>`
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker);
      });

      marker.setMap(map);
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, waypoints]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: height,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default MapComponent;
