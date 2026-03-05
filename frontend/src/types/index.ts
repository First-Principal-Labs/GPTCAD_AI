export interface GenerateRequest {
  prompt: string;
  project_id?: string;
}

export interface GenerateResponse {
  project_id: string;
  model_url: string;
  code: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  model_url?: string;
  timestamp: number;
}
