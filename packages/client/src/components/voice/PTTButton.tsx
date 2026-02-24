import { useGameStore } from '../../state/gameStore';

interface PTTButtonProps {
  onStart: () => void;
  onStop: () => void;
}

export function PTTButton({ onStart, onStop }: PTTButtonProps) {
  const transmitting = useGameStore((s) => s.transmitting);
  const battery = useGameStore((s) => s.battery);
  const depleted = battery <= 0;

  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      disabled={depleted}
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: depleted
          ? 'var(--bg-secondary)'
          : transmitting
          ? 'rgba(255, 51, 68, 0.3)'
          : 'var(--bg-panel)',
        border: `2px solid ${
          depleted
            ? 'var(--text-dim)'
            : transmitting
            ? 'var(--accent-red)'
            : 'var(--accent-green)'
        }`,
        color: depleted ? 'var(--text-dim)' : transmitting ? 'var(--accent-red)' : 'var(--accent-green)',
        fontSize: '0.6rem',
        letterSpacing: '2px',
        boxShadow: transmitting
          ? '0 0 20px rgba(255, 51, 68, 0.4), inset 0 0 20px rgba(255, 51, 68, 0.1)'
          : depleted
          ? 'none'
          : '0 0 10px rgba(0, 255, 136, 0.2)',
        transition: 'all 0.15s ease',
      }}
    >
      {depleted ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="var(--text-dim)" strokeWidth="2.5" />
        </svg>
      ) : transmitting ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="rgba(255,51,68,0.3)" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
          <path d="M1 12c1.5-1 2.5-1.5 3-1.5" opacity="0.6" />
          <path d="M23 12c-1.5-1-2.5-1.5-3-1.5" opacity="0.6" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
