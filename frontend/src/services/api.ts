import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface TreatmentGuide {
  crop: string;
  disease: string;
  symptoms: string[];
  immediateAction: string;
  treatment: string;
  prevention: string;
  youtubeLink: string;
}

export interface PredictionResult {
  prediction: string;
  confidence: number;
  is_uncertain: boolean;
  confidence_message: string;
  heatmap: string | null;
  top_3: Array<{
    class_name: string;
    confidence: number;
  }>;
}

export interface ChatResponse {
  response: string;
  matched_class: string | null;
}

export const api = {
  predict: async (file: File): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  chat: async (message: string, history: any[] = []): Promise<ChatResponse> => {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message,
      history,
    });
    return response.data;
  },

  // New method to fetch guides
  getGuides: async (): Promise<TreatmentGuide[]> => {
    const response = await axios.get(`${API_BASE_URL}/guides`);
    return response.data;
  },
};