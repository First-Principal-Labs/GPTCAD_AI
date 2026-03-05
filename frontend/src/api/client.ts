import axios from 'axios';
import type { GenerateRequest, GenerateResponse, IterateRequest, IterateResponse } from '../types';

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
