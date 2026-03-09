import { useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Bot, User, RotateCcw, Code2 } from 'lucide-react';

export default function ChatHistory() {
  const messages = useAppStore((s) => s.messages);
  const currentVersion = useAppStore((s) => s.currentVersion);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const streamingContent = useAppStore((s) => s.streamingContent);
  const generationStatus = useAppStore((s) => s.generationStatus);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleRestore = (msg: typeof messages[0]) => {
    if (msg.model_url && msg.code && msg.version) {
      const url = msg.model_url.split('?')[0];
      setModelUrl(`${url}?v=${Date.now()}`);
      setCode(msg.code);
      setCurrentVersion(msg.version);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3 px-6">
        <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center">
          <Bot size={24} strokeWidth={1.5} className="opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-text-secondary mb-1">Start designing</p>
          <p className="text-xs leading-relaxed">
            Describe the 3D model you want to create and GPTCAD will generate it for you
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
            msg.role === 'user' ? 'bg-accent/20' : 'bg-bg-elevated'
          }`}>
            {msg.role === 'user' ? (
              <User size={12} className="text-accent" />
            ) : (
              <Bot size={12} className="text-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}
            </p>
            {msg.role === 'assistant' && msg.model_url && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="text-xs text-success flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Model generated
                </div>
                {msg.version && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted font-mono">
                    v{msg.version}
                  </span>
                )}
                {msg.version && msg.version !== currentVersion && (
                  <button
                    onClick={() => handleRestore(msg)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-0.5"
                    title="Restore this version"
                  >
                    <RotateCcw size={9} />
                    Restore
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Streaming indicator */}
      {isGenerating && (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-bg-elevated">
            <Bot size={12} className="text-text-secondary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            {generationStatus && (
              <div className="text-[10px] text-accent font-medium mb-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {generationStatus}
              </div>
            )}
            {streamingContent && (
              <div className="bg-bg-elevated rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-1 mb-1">
                  <Code2 size={10} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted">Generating code...</span>
                </div>
                <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {streamingContent.slice(-500)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
