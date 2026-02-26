import { useState, useEffect } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { socketService } from '../../../services/socketService';

interface ValveState {
  id: number;
  isOpen: boolean;
}

export function ValvePanel() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const serverValves = puzzleData.valves as ValveState[] | undefined;
  const valveCount = (puzzleData.valveCount as number | undefined) ?? 6;

  const [localValves, setLocalValves] = useState<ValveState[]>(() =>
    serverValves ?? Array.from({ length: valveCount }, (_, i) => ({ id: i + 1, isOpen: false }))
  );

  // Sync local state when server sends an update
  useEffect(() => {
    if (serverValves) {
      setLocalValves(serverValves);
    }
  }, [serverValves]);

  const handleToggle = (id: number) => {
    // Optimistic update
    setLocalValves((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isOpen: !v.isOpen } : v))
    );
    socketService.send({ type: 'PUZZLE_ACTION', action: 'TOGGLE', value: id });
  };

  const handleSubmit = () => {
    socketService.send({ type: 'PUZZLE_ACTION', action: 'SUBMIT', value: 0 });
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        color: 'var(--text-dim)',
        letterSpacing: '3px',
        fontSize: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        VALVE CONTROL PANEL
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        maxWidth: '400px',
        margin: '0 auto 1.5rem',
      }}>
        {localValves.map((valve) => (
          <button
            key={valve.id}
            onClick={() => handleToggle(valve.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 1rem',
              background: valve.isOpen
                ? 'rgba(0, 255, 136, 0.1)'
                : 'rgba(255, 51, 51, 0.1)',
              border: `1px solid ${valve.isOpen ? 'var(--accent-green)' : 'var(--accent-red)'}`,
              color: valve.isOpen ? 'var(--accent-green)' : 'var(--accent-red)',
              cursor: 'pointer',
              letterSpacing: '2px',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-dim)' }}>VALVE {valve.id}</span>
            <span style={{ fontWeight: 'bold' }}>
              {valve.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        style={{
          background: 'rgba(0, 255, 136, 0.1)',
          color: 'var(--accent-green)',
          border: '2px solid var(--accent-green)',
          padding: '12px 48px',
          fontSize: '1.1rem',
          letterSpacing: '4px',
          boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)',
          cursor: 'pointer',
        }}
      >
        CONFIRM
      </button>
    </div>
  );
}
