import axios from 'axios';
import type {
  GenerateRequest, GenerateResponse,
  IterateRequest, IterateResponse,
  ManualRequest, ManualResponse,
  CodeRunRequest, CodeRunResponse,
  ProjectSummary, ProjectDetail,
  ExportFormat,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export async function generateModel(req: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>('/generate', req);
  return data;
}

export async function iterateModel(req: IterateRequest): Promise<IterateResponse> {
  const { data } = await api.post<IterateResponse>('/iterate', req);
  return data;
}

export async function manualOperation(req: ManualRequest): Promise<ManualResponse> {
  const { data } = await api.post<ManualResponse>('/manual', req);
  return data;
}

export async function runCode(req: CodeRunRequest): Promise<CodeRunResponse> {
  const { data } = await api.post<CodeRunResponse>('/code/run', req);
  return data;
}

// Project management
export async function listProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get<ProjectSummary[]>('/projects');
  return data;
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${projectId}`);
  return data;
}

export async function createProject(name?: string): Promise<ProjectSummary> {
  const { data } = await api.post<ProjectSummary>('/projects', { name });
  return data;
}

export async function renameProject(projectId: string, name: string): Promise<ProjectSummary> {
  const { data } = await api.patch<ProjectSummary>(`/projects/${projectId}`, { name });
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

// Export
export function getExportUrl(projectId: string, format: ExportFormat): string {
  return `/api/export/${projectId}?format=${format}`;
}

// SSE streaming
export interface StreamCallbacks {
  onStatus?: (status: string) => void;
  onToken?: (token: string) => void;
  onResult?: (result: { project_id: string; model_url: string; code: string; version: number }) => void;
  onError?: (error: string) => void;
}

async function consumeSSE(url: string, body: object, callbacks: StreamCallbacks, signal?: AbortSignal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (currentEvent === 'status') callbacks.onStatus?.(data);
        else if (currentEvent === 'token') callbacks.onToken?.(data);
        else if (currentEvent === 'result') callbacks.onResult?.(data);
        else if (currentEvent === 'error') callbacks.onError?.(data.detail || data);
      }
    }
  }
}

export function streamGenerate(
  req: { prompt: string; project_id?: string },
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  return consumeSSE('/api/generate/stream', req, callbacks, signal);
}

export function streamIterate(
  req: { project_id: string; instruction: string; current_code: string; history?: { role: string; content: string }[] },
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  return consumeSSE('/api/iterate/stream', req, callbacks, signal);
}
