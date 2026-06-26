import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

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

class PlantGuardApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async predict(file: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${this.baseUrl}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async chat(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const response = await axios.post(`${this.baseUrl}/chat`, {
      message,
      history,
    });
    return response.data;
  }

  async getGuides(): Promise<TreatmentGuide[]> {
    const response = await axios.get(`${this.baseUrl}/guides`);
    return response.data;
  }
}

export const api = new PlantGuardApiClient(API_BASE_URL);
