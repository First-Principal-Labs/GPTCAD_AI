import axios from 'axios';
import type { GenerateRequest, GenerateResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export async function generateModel(req: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>('/generate', req);
  return data;
}
