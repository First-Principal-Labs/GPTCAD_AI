import axios from 'axios';
import type {
  GenerateRequest, GenerateResponse,
  IterateRequest, IterateResponse,
  ManualRequest, ManualResponse,
  CodeRunRequest, CodeRunResponse,
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
