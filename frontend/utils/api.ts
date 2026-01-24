// API configuration and utilities for SnapShroom frontend

const API_BASE_URL = 'http://192.168.1.100:5000'; // Update this with your backend IP

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
      const response = await fetch(`${this.baseUrl}/api/toxicity/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend server is running.');
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
      const response = await fetch(`${this.baseUrl}/`, {
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
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