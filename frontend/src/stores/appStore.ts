import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface AppState {
  // Project
  projectId: string | null;
  projectName: string;
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;

  // Model
  modelUrl: string | null;
  setModelUrl: (url: string | null) => void;

  // Code
  code: string;
  previousCode: string;
  setCode: (code: string) => void;

  // Version
  currentVersion: number;
  setCurrentVersion: (v: number) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  // Model info
  modelInfo: { faces: number; vertices: number; bbox: [number, number, number] } | null;
  setModelInfo: (info: { faces: number; vertices: number; bbox: [number, number, number] } | null) => void;

  // Render mode
  renderMode: 'shaded' | 'wireframe' | 'shaded-wireframe' | 'xray';
  setRenderMode: (mode: 'shaded' | 'wireframe' | 'shaded-wireframe' | 'xray') => void;

  // Visual style preset
  visualStyle: 'cad' | 'studio';
  setVisualStyle: (style: 'cad' | 'studio') => void;

  // UI state
  isGenerating: boolean;
  setGenerating: (v: boolean) => void;
  generationStatus: string;
  setGenerationStatus: (s: string) => void;
  streamingContent: string;
  appendStreamingContent: (s: string) => void;
  clearStreamingContent: () => void;
  error: string | null;
  setError: (e: string | null) => void;

  // Camera
  fitViewTrigger: number;
  triggerFitView: () => void;

  // Reset project
  resetProject: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  projectId: null,
  projectName: 'Untitled Project',
  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),

  modelUrl: null,
  setModelUrl: (url) => set({ modelUrl: url }),

  code: '',
  previousCode: '',
  setCode: (code) => set((s) => ({ previousCode: s.code, code })),

  currentVersion: 0,
  setCurrentVersion: (v) => set({ currentVersion: v }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  modelInfo: null,
  setModelInfo: (info) => set({ modelInfo: info }),

  renderMode: 'shaded',
  setRenderMode: (mode) => set({ renderMode: mode }),

  visualStyle: 'cad',
  setVisualStyle: (style) => set({ visualStyle: style }),

  isGenerating: false,
  setGenerating: (v) => set({ isGenerating: v }),
  generationStatus: '',
  setGenerationStatus: (s) => set({ generationStatus: s }),
  streamingContent: '',
  appendStreamingContent: (s) => set((state) => ({ streamingContent: state.streamingContent + s })),
  clearStreamingContent: () => set({ streamingContent: '' }),
  error: null,
  setError: (e) => set({ error: e }),

  fitViewTrigger: 0,
  triggerFitView: () => set((s) => ({ fitViewTrigger: s.fitViewTrigger + 1 })),

  resetProject: () =>
    set({
      projectId: null,
      projectName: 'Untitled Project',
      modelUrl: null,
      code: '',
      previousCode: '',
      currentVersion: 0,
      messages: [],
      modelInfo: null,
      error: null,
    }),
}));
