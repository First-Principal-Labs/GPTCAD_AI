import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface AppState {
  // Project
  projectId: string | null;
  setProjectId: (id: string) => void;

  // Model
  modelUrl: string | null;
  setModelUrl: (url: string | null) => void;

  // Code
  code: string;
  setCode: (code: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  // UI state
  isGenerating: boolean;
  setGenerating: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  projectId: null,
  setProjectId: (id) => set({ projectId: id }),

  modelUrl: null,
  setModelUrl: (url) => set({ modelUrl: url }),

  code: '',
  setCode: (code) => set({ code }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  isGenerating: false,
  setGenerating: (v) => set({ isGenerating: v }),
  error: null,
  setError: (e) => set({ error: e }),
}));
