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

export interface ManualRequest {
  operation: string;
  category: 'primitive' | 'boolean' | 'transform';
  params: Record<string, number | string>;
  project_id?: string;
  existing_code?: string;
}

export interface ManualResponse {
  project_id: string;
  model_url: string;
  code: string;
  version: number;
}

export interface CodeRunRequest {
  code: string;
  project_id?: string;
}

export interface CodeRunResponse {
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

export interface ProjectSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  versions: { version: number; model_url: string; code?: string }[];
}

export type ExportFormat = 'step' | 'stl' | 'obj' | 'glb' | 'py';
