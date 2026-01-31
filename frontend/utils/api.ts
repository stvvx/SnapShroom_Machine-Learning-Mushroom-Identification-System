// API configuration and utilities for SnapShroom frontend

// IMPORTANT: Update this with your actual backend IP address
// For phone testing: Use your computer's local IP (e.g., 'http://192.168.1.XXX:5000')
// Find your IP: Windows: ipconfig | Mac/Linux: ifconfig
// 
// STEP 1: Find your IP address:
//   Windows: Open Command Prompt, type: ipconfig
//   Look for "IPv4 Address" (e.g., 192.168.1.102)
//
// STEP 2: Replace the IP below with YOUR computer's IP address
// STEP 3: Make sure phone and computer are on the SAME WiFi network

// IMPORTANT: Always use your computer's IP address, NOT localhost!
// localhost only works on the same device, not from phone
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.112:5000';
 // ⚠️ CHANGE THIS to your computer's IP address!

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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async analyzeMushroom(data: MushroomAnalysisRequest): Promise<MushroomAnalysisResponse> {
    try {
      console.log('API Request URL:', `${this.baseUrl}/api/toxicity/predict`);
      console.log('Request payload size:', JSON.stringify(data).length, 'bytes');
      
      // Create AbortController for timeout (AbortSignal.timeout not available in React Native)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${this.baseUrl}/api/toxicity/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId); // Clear timeout if request succeeds

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response received successfully');
      return result;
    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Network Request Failed')) {
          throw new Error(
            `Cannot connect to backend at ${this.baseUrl}\n\n` +
            `Troubleshooting steps:\n` +
            `1. Is backend running? (Run: python app.py in backend folder)\n` +
            `2. Check IP address in utils/api.ts matches your computer's IP\n` +
            `3. Find your IP: Windows: ipconfig | Mac/Linux: ifconfig\n` +
            `4. Phone and computer must be on SAME WiFi network\n` +
            `5. Test in phone browser: http://YOUR_IP:5000\n` +
            `6. Check Windows Firewall isn't blocking port 5000`
          );
        }
      }
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out after 60 seconds. The analysis is taking too long. Please try again with a clearer image.');
      }
      
      throw error;
    }
  }

  async getSpeciesList() {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset/species`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching species list:', error);
      throw error;
    }
  }

  async getSpeciesDetails(speciesName: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset/species/${encodeURIComponent(speciesName)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching species details:', error);
      throw error;
    }
  }

  async getDatasetInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset/info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dataset info:', error);
      throw error;
    }
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', this.baseUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isOk = response.ok;
      console.log('Connection test result:', isOk, response.status);
      return isOk;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout - server not responding');
      }
      throw new Error(`Cannot connect: ${error.message || 'Network error'}`);
    }
  }
}

// Create and export the API service instance
export const apiService = new ApiService(API_BASE_URL);

// Export individual functions for convenience
export const analyzeMushroom = (data: MushroomAnalysisRequest) =>
  apiService.analyzeMushroom(data);

export const getSpeciesList = () => apiService.getSpeciesList();
export const getSpeciesDetails = (speciesName: string) =>
  apiService.getSpeciesDetails(speciesName);
export const getDatasetInfo = () => apiService.getDatasetInfo();
export const testConnection = () => apiService.testConnection();