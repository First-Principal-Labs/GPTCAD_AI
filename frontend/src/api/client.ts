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
