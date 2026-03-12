import { useState } from 'react';
import { socketService } from '../../services/socketService';
import { useGameStore } from '../../state/gameStore';
import { WaitingRoom } from './WaitingRoom';

export function LobbyScreen() {
  const roomId = useGameStore((s) => s.roomId);
  const searching = useGameStore((s) => s.searching);
  const [joinCode, setJoinCode] = useState('');

  if (roomId) {
    return <WaitingRoom />;
  }

  if (searching) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '2rem',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: 'var(--accent-green)',
          textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          letterSpacing: '8px',
        }}>
          ABYSSAL ECHO
        </h1>
        <p style={{
          color: 'var(--accent-amber)',
          fontSize: '1.1rem',
          letterSpacing: '4px',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          SEARCHING FOR PARTNER...
        </p>
        <button
          onClick={() => socketService.send({ type: 'CANCEL_FIND_GAME' })}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-dim)',
            border: '1px solid var(--text-dim)',
            padding: '12px 32px',
            fontSize: '1rem',
            letterSpacing: '3px',
          }}
        >
          CANCEL
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '2rem',
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        color: 'var(--accent-green)',
        textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
        letterSpacing: '8px',
      }}>
        ABYSSAL ECHO
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        ASYMMETRIC SUBMARINE COMMUNICATION
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => socketService.send({ type: 'FIND_GAME' })}
          style={{
            background: 'var(--accent-green)',
            color: 'var(--bg-deep)',
            border: '1px solid var(--accent-green)',
            padding: '14px 32px',
            fontSize: '1.1rem',
            letterSpacing: '3px',
            fontWeight: 'bold',
          }}
        >
          FIND GAME
        </button>

        <div style={{
          borderTop: '1px solid var(--text-dim)',
          margin: '0.5rem 0',
          opacity: 0.3,
        }} />

        <button
          onClick={() => socketService.send({ type: 'CREATE_ROOM' })}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)',
            padding: '12px 32px',
            fontSize: '1rem',
            letterSpacing: '3px',
          }}
        >
          PLAY WITH FRIEND
        </button>

        <p style={{
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
          letterSpacing: '2px',
          marginBottom: '-0.5rem',
        }}>
          Have a code?
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            maxLength={4}
            placeholder="CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            style={{ width: '120px' }}
          />
          <button
            onClick={() => {
              if (joinCode.length === 4) {
                socketService.send({ type: 'JOIN_ROOM', roomId: joinCode });
              }
            }}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--accent-amber)',
              border: '1px solid var(--accent-amber)',
              padding: '12px 24px',
              fontSize: '1rem',
              letterSpacing: '3px',
            }}
          >
            JOIN
          </button>
        </div>
      </div>
    </div>
  );
}
