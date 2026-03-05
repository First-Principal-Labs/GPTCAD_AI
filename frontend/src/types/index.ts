export interface GenerateRequest {
  prompt: string;
  project_id?: string;
}

export interface GenerateResponse {
  project_id: string;
  model_url: string;
  code: string;
  version: number;
}

export interface IterateRequest {
  project_id: string;
  instruction: string;
  current_code: string;
  history?: { role: string; content: string }[];
}

export interface IterateResponse {
  project_id: string;
  model_url: string;
  code: string;
  version: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  model_url?: string;
  version?: number;
  timestamp: number;
}
