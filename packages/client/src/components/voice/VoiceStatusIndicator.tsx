import { useGameStore } from '../../state/gameStore';

export function VoiceStatusIndicator() {
  const transmitting = useGameStore((s) => s.transmitting);
  const receiving = useGameStore((s) => s.receiving);

  const status = transmitting ? 'TRANSMITTING' : receiving ? 'INCOMING' : 'SILENT';

  if (status === 'SILENT') {
    return <div style={{ width: '120px' }} />;
  }

  if (status === 'INCOMING') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'pulse 0.8s ease-in-out infinite',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,170,0,0.2)" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.5" />
        </svg>
        <span style={{
          color: 'var(--accent-amber)',
          fontSize: '0.7rem',
          letterSpacing: '3px',
          textShadow: '0 0 8px rgba(255,170,0,0.4)',
        }}>
          INCOMING
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'var(--accent-red)',
        boxShadow: '0 0 8px var(--accent-red)',
      }} />
      <span style={{
        color: 'var(--accent-red)',
        fontSize: '0.7rem',
        letterSpacing: '3px',
      }}>
        TRANSMITTING
      </span>
    </div>
  );
}
