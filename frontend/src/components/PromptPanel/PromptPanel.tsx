import { MessageSquare } from 'lucide-react';
import ChatHistory from './ChatHistory';
import SuggestionChips from './SuggestionChips';
import PromptInput from './PromptInput';

export default function PromptPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-9 flex items-center px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Prompt
          </span>
        </div>
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
