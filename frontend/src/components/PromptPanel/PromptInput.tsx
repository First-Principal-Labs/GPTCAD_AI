import { useState, useCallback, useRef } from 'react';
import { Send, Loader2, StopCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { streamGenerate, streamIterate } from '../../api/client';
import type { ChatMessage } from '../../types';

export default function PromptInput() {
  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isGenerating = useAppStore((s) => s.isGenerating);
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setGenerationStatus = useAppStore((s) => s.setGenerationStatus);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setProjectId = useAppStore((s) => s.setProjectId);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const addMessage = useAppStore((s) => s.addMessage);
  const setError = useAppStore((s) => s.setError);
  const appendStreamingContent = useAppStore((s) => s.appendStreamingContent);
  const clearStreamingContent = useAppStore((s) => s.clearStreamingContent);
  const projectId = useAppStore((s) => s.projectId);
  const code = useAppStore((s) => s.code);
  const messages = useAppStore((s) => s.messages);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setGenerationStatus('');
    clearStreamingContent();
  }, [setGenerating, setGenerationStatus, clearStreamingContent]);

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setInput('');
    setError(null);
    clearStreamingContent();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setGenerating(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const callbacks = {
        onStatus: (status: string) => setGenerationStatus(status),
        onToken: (token: string) => appendStreamingContent(token),
        onResult: (result: { project_id: string; model_url: string; code: string; version: number }) => {
          setProjectId(result.project_id);
          setModelUrl(result.model_url);
          setCode(result.code);
          setCurrentVersion(result.version);

          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Model generated successfully.',
            code: result.code,
            model_url: result.model_url,
            version: result.version,
            timestamp: Date.now(),
          });
        },
        onError: (error: string) => {
          setError(error);
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${error}`,
            timestamp: Date.now(),
          });
        },
      };

      if (projectId && code) {
        const history = messages
          .filter((m) => m.role === 'user')
          .map((m) => ({ role: 'user' as const, content: m.content }));

        await streamIterate(
          { project_id: projectId, instruction: prompt, current_code: code, history },
          callbacks,
          controller.signal,
        );
      } else {
        await streamGenerate(
          { prompt },
          callbacks,
          controller.signal,
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = err.message || 'Generation failed';
        setError(errorMsg);
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        });
      }
    } finally {
      setGenerating(false);
      setGenerationStatus('');
      clearStreamingContent();
      abortRef.current = null;
    }
  }, [input, isGenerating, projectId, code, messages, setGenerating, setGenerationStatus, setModelUrl, setCode, setProjectId, setCurrentVersion, addMessage, setError, appendStreamingContent, clearStreamingContent]);

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
        {isGenerating ? (
          <button
            onClick={handleCancel}
            className="p-2.5 bg-error/80 hover:bg-error rounded-lg text-white transition-colors shrink-0"
            title="Cancel generation"
          >
            <StopCircle size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-accent hover:bg-accent-hover rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={14} />
          </button>
        )}
      </div>
      <p className="text-[10px] text-text-muted mt-1.5 px-0.5">
        {projectId ? 'Iterating on current model' : 'Enter to send, Shift+Enter for new line'}
      </p>
    </div>
  );
}
