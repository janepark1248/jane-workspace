export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="text-ove-muted text-xs shrink-0 mt-1">ove</span>
      <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
        <div className="flex gap-1.5 items-center" style={{ height: '16px' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-ove-muted block"
              style={{
                animation: 'ove-typing-dot 1.2s ease infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
