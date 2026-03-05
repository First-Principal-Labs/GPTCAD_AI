import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { generateModel, iterateModel } from '../../api/client';
import type { ChatMessage } from '../../types';

export default function PromptInput() {
  const [input, setInput] = useState('');

  const isGenerating = useAppStore((s) => s.isGenerating);
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setProjectId = useAppStore((s) => s.setProjectId);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const addMessage = useAppStore((s) => s.addMessage);
  const setError = useAppStore((s) => s.setError);
  const projectId = useAppStore((s) => s.projectId);
  const code = useAppStore((s) => s.code);
  const messages = useAppStore((s) => s.messages);

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setInput('');
    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    addMessage(userMsg);

    setGenerating(true);

    try {
      let result: { project_id: string; model_url: string; code: string; version: number };

      if (projectId && code) {
        // Iterate on existing project
        const history = messages
          .filter((m) => m.role === 'user')
          .map((m) => ({ role: 'user' as const, content: m.content }));

        result = await iterateModel({
          project_id: projectId,
          instruction: prompt,
          current_code: code,
          history,
        });
      } else {
        // First generation
        result = await generateModel({ prompt });
      }

      setProjectId(result.project_id);
      setModelUrl(result.model_url);
      setCode(result.code);
      setCurrentVersion(result.version);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Model generated successfully.',
        code: result.code,
        model_url: result.model_url,
        version: result.version,
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Generation failed';
      setError(errorMsg);

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: Date.now(),
      });
    } finally {
      setGenerating(false);
    }
  }, [input, isGenerating, projectId, code, messages, setGenerating, setModelUrl, setCode, setProjectId, setCurrentVersion, addMessage, setError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-border">
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={projectId ? 'Describe changes to your model...' : 'Describe a 3D model...'}
          rows={2}
          disabled={isGenerating}
          className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          className="p-2.5 bg-accent hover:bg-accent-hover rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
      <p className="text-[10px] text-text-muted mt-1.5 px-0.5">
        {projectId ? 'Iterating on current model' : 'Enter to send, Shift+Enter for new line'}
      </p>
    </div>
  );
}
