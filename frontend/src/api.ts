import axios from 'axios';
import { LoopRequest, LoopResponse } from './types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateLoopRoute = async (request: LoopRequest): Promise<LoopResponse> => {
  try {
    const response = await api.post('/api/loop', request);
    return response.data;
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
};

export const downloadGPX = (gpxBase64: string, filename: string = 'running-route.gpx') => {
  try {
    const binaryString = atob(gpxBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('GPX 다운로드 오류:', error);
    throw error;
  }
};
