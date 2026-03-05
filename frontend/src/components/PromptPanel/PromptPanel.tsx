import { MessageSquare, PanelRightClose } from 'lucide-react';
import ChatHistory from './ChatHistory';
import SuggestionChips from './SuggestionChips';
import PromptInput from './PromptInput';

export default function PromptPanel({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Prompt
          </span>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-0.5 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
            title="Collapse panel"
          >
            <PanelRightClose size={13} />
          </button>
        )}
      </div>

      {/* Chat History */}
      <ChatHistory />

      {/* Suggestions */}
      <SuggestionChips />

      {/* Input */}
      <PromptInput />
    </div>
  );
}
