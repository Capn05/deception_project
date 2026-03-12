import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { socketService } from '../../services/socketService';

export function WaitingRoom() {
  const roomId = useGameStore((s) => s.roomId);
  const role = useGameStore((s) => s.role);
  const partnered = useGameStore((s) => s.partnered);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const [isReady, setIsReady] = useState(false);

  const handleLeave = () => {
    socketService.send({ type: 'LEAVE_GAME' });
    leaveGame();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '1.5rem',
    }}>
      <h2 style={{ color: 'var(--accent-green)', letterSpacing: '4px' }}>
        ROOM: {roomId}
      </h2>
      <p style={{ color: 'var(--text-dim)' }}>
        ROLE: <span style={{ color: 'var(--accent-amber)' }}>{role}</span>
      </p>

      {partnered ? (
        <>
          <p style={{ color: 'var(--accent-green)' }}>PARTNER CONNECTED</p>
          <button
            onClick={() => {
              if (!isReady) {
                socketService.send({ type: 'READY' });
                setIsReady(true);
              }
            }}
            disabled={isReady}
            style={{
              background: isReady ? 'rgba(0, 255, 136, 0.15)' : 'var(--bg-panel)',
              color: isReady ? 'var(--accent-green)' : 'var(--accent-green)',
              border: isReady ? '2px solid var(--accent-green)' : '1px solid var(--accent-green)',
              padding: '12px 32px',
              fontSize: '1rem',
              letterSpacing: '3px',
              marginTop: '1rem',
              opacity: isReady ? 0.8 : 1,
              cursor: isReady ? 'default' : 'pointer',
            }}
          >
            {isReady ? 'READY \u2713' : 'READY'}
          </button>
        </>
      ) : (
        <p style={{
          color: 'var(--text-dim)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          AWAITING PARTNER...
        </p>
      )}

      <button
        onClick={handleLeave}
        style={{
          background: 'transparent',
          color: 'var(--text-dim)',
          border: '1px solid var(--text-dim)',
          padding: '8px 24px',
          fontSize: '0.8rem',
          letterSpacing: '3px',
          marginTop: '1rem',
          cursor: 'pointer',
        }}
      >
        LEAVE
      </button>
    </div>
  );
}
