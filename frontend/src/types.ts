export interface Coordinate {
  lat: number;
  lon: number;
}

export interface LoopRequest {
  start: Coordinate;
  target_km: number;
  mode: 'walk' | 'bike' | 'car';
  constraints?: {
    elev_avoid?: boolean;
    max_turns?: number;
    avoid_highways?: boolean;
    prefer_bikepaths?: boolean;
  };
}

export interface LoopResponse {
  distance_m: number;
  duration_s: number;
  geojson: any;
  gpx: string;
  waypoints: Coordinate[];
  success: boolean;
  message?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: Coordinate[];
}
