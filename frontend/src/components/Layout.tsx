export default function Layout() {
  return (
    <div className="flex flex-col h-screen w-screen bg-bg-primary">
      {/* Top Bar */}
      <div className="h-12 flex items-center px-4 border-b border-border bg-bg-panel shrink-0">
        <span className="text-lg font-bold tracking-tight text-accent">GPTCAD</span>
      </div>

      {/* Main Content - placeholder */}
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        <span className="text-sm">Loading panels...</span>
      </div>

      {/* Status Bar */}
      <div className="h-7 flex items-center px-4 border-t border-border bg-bg-panel text-xs text-text-muted shrink-0">
        <span>Ready</span>
      </div>
    </div>
  )
}
