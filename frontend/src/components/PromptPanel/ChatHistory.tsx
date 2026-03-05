import { useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Bot, User } from 'lucide-react';

export default function ChatHistory() {
  const messages = useAppStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
              <div className="mt-1.5 text-xs text-success flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Model generated
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
