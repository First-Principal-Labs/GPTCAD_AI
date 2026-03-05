import { useAppStore } from '../../stores/appStore';
import { streamGenerate, streamIterate } from '../../api/client';
import type { ChatMessage } from '../../types';

const INITIAL_SUGGESTIONS = [
  'Create a simple gear',
  'Make a flanged bearing housing',
  'Design a phone stand',
  'Create a hex bolt M10',
];

const ITERATION_SUGGESTIONS = [
  'Add fillets to all edges',
  'Make it hollow with 2mm walls',
  'Add 4 mounting holes',
  'Scale up 2x',
  'Add chamfers',
  'Round the corners',
];

export default function SuggestionChips() {
  const projectId = useAppStore((s) => s.projectId);
  const code = useAppStore((s) => s.code);
  const messages = useAppStore((s) => s.messages);
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

  const suggestions = projectId && code ? ITERATION_SUGGESTIONS : INITIAL_SUGGESTIONS;

  const handleChip = async (prompt: string) => {
    if (isGenerating) return;

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

    try {
      if (projectId && code) {
        const history = messages
          .filter((m) => m.role === 'user')
          .map((m) => ({ role: 'user' as const, content: m.content }));
        await streamIterate(
          { project_id: projectId, instruction: prompt, current_code: code, history },
          callbacks,
        );
      } else {
        await streamGenerate({ prompt }, callbacks);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Generation failed');
      }
    } finally {
      setGenerating(false);
      setGenerationStatus('');
      clearStreamingContent();
    }
  };

  if (isGenerating) return null;

  return (
    <div className="px-3 py-2 flex flex-wrap gap-1.5">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => handleChip(s)}
          className="px-2.5 py-1 text-[10px] rounded-full border border-border text-text-muted hover:text-text-primary hover:border-accent/50 hover:bg-accent/5 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
