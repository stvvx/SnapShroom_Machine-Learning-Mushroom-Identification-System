// API configuration and utilities for SnapShroom frontend
// =======================================================
//
// CONNECTION MODES (IMPORTANT):
//
// ✅ NGROK MODE (RECOMMENDED for phone + Expo):
//    Set EXPO_PUBLIC_API_URL to your ACTIVE ngrok HTTPS URL
//
// ❌ LAN MODE (optional, same WiFi only):
//    Use http://<YOUR_LOCAL_IP>:5000
//
// ⚠️ DO NOT mix ngrok + LAN instructions
// =======================================================

// -------------------------------------------------------
// BASE URL RESOLUTION
// -------------------------------------------------------

// 1️⃣ Primary: Expo public env (BEST for ngrok)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// 2️⃣ Fallback: local LAN (only if env not set)
const FALLBACK_LAN_URL = 'http://192.168.1.12:5000'; // ← optional, dev only

// 3️⃣ Final resolved base URL
const API_BASE_URL = ENV_API_URL || FALLBACK_LAN_URL;

// Debug (very helpful)
console.log('🔗 API_BASE_URL:', API_BASE_URL);


// -------------------------------------------------------
// TYPES
// -------------------------------------------------------

export interface MushroomAnalysisRequest {
  image_base64: string;
  location?: {
    region: string;
    province: string;
  };
  date?: string;
  user_context?: {
    experience_level?: 'novice' | 'intermediate' | 'expert';
    purpose?: string;
    location_familiar?: boolean;
  };
}

export interface MushroomAnalysisResponse {
  timestamp: string;
  image_analysis: {
    species: any;
    toxicity: any;
    habitat: any;
  };
  risk_assessment: any;
  recommendations: string[];
  safety_actions: string[];
}


// -------------------------------------------------------
// API SERVICE
// -------------------------------------------------------

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // remove trailing slash
  }

  // ---------------------------------------------------
  // MAIN ANALYSIS
  // ---------------------------------------------------
  async analyzeMushroom(
    data: MushroomAnalysisRequest
  ): Promise<MushroomAnalysisResponse> {
    const url = `${this.baseUrl}/toxicity/predict`;

    try {
      console.log('📡 POST', url);
      console.log('📦 Payload size:', JSON.stringify(data).length, 'bytes');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('✅ Response:', response.status, response.statusText);

      if (!response.ok) {
        let errorText = response.statusText;
        try {
          const errJson = await response.json();
          errorText = errJson.error || JSON.stringify(errJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(`Backend error (${response.status}): ${errorText}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('❌ API Error:', error);

      // Network / unreachable backend
      if (
        error?.message?.includes('Network') ||
        error?.message?.includes('Failed') ||
        error?.name === 'TypeError'
      ) {
        throw new Error(
          `Analysis Failed\n\n` +
          `Cannot connect to backend at:\n${this.baseUrl}\n\n` +
          `Checklist:\n` +
          `• Is Flask running? (python app.py)\n` +
          `• Is ngrok running RIGHT NOW?\n` +
          `• Did you update EXPO_PUBLIC_API_URL with the CURRENT ngrok URL?\n` +
          `• Try opening this in a browser:\n  ${this.baseUrl}/health`
        );
      }

      // Timeout
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out after 60 seconds.\n' +
          'Try using a clearer image or retry.'
        );
      }

      throw error;
    }
  }

  // ---------------------------------------------------
  // HEALTH CHECK
  // ---------------------------------------------------
  async testConnection(): Promise<boolean> {
    const url = `${this.baseUrl}/health`;

    try {
      console.log('🔍 Testing backend:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('💚 Health:', response.status);
      return response.ok;

    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      throw new Error(
        `Backend unreachable at ${this.baseUrl}\n` +
        `• Is Flask running?\n` +
        `• Is ngrok active?\n` +
        `• Is the URL correct?`
      );
    }
  }
}


// -------------------------------------------------------
// EXPORTS
// -------------------------------------------------------

export const apiService = new ApiService(API_BASE_URL);

export const analyzeMushroom = (data: MushroomAnalysisRequest) =>
  apiService.analyzeMushroom(data);

export const testConnection = () =>
  apiService.testConnection();
