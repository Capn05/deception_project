import { useCallback } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { socketService } from '../../../services/socketService';
import type { WireColor, WirePort } from '@abyssal-echo/shared';

const COLOR_STYLES: Record<WireColor, { bg: string; border: string; text: string }> = {
  RED: { bg: 'rgba(255, 51, 51, 0.15)', border: '#ff3333', text: '#ff3333' },
  BLUE: { bg: 'rgba(51, 102, 255, 0.15)', border: '#3366ff', text: '#3366ff' },
  BLACK: { bg: 'rgba(160, 160, 160, 0.15)', border: '#a0a0a0', text: '#a0a0a0' },
};

const OCCURRENCE_LABELS = ['', '1ST', '2ND', '3RD', '4TH'];

export function WireSequenceOperator() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const currentWire = puzzleData.currentWire as { color: WireColor; port: WirePort } | undefined;
  const currentWireIndex = (puzzleData.currentWireIndex as number | undefined) ?? 0;
  const colorOccurrence = (puzzleData.colorOccurrence as number | undefined) ?? 1;
  const totalWires = (puzzleData.totalWires as number | undefined) ?? 8;
  const wiresProcessed = (puzzleData.wiresProcessed as number | undefined) ?? 0;
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 2;
  const completed = (puzzleData.completed as boolean | undefined) ?? false;

  const handleDecide = useCallback((shouldCut: boolean) => {
    socketService.send({ type: 'PUZZLE_ACTION', action: 'DECIDE', value: shouldCut ? 1 : 0 });
  }, []);

  if (completed || !currentWire) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.85rem' }}>
          {completed ? 'WIRE SEQUENCE COMPLETE' : 'LOADING WIRE DATA...'}
        </p>
      </div>
    );
  }

  const colorStyle = COLOR_STYLES[currentWire.color];

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.75rem', margin: 0 }}>
        WIRE SEQUENCE
      </p>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        REPORT WIRE COLOR, OCCURRENCE, AND PORT TO YOUR OBSERVER
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>WIRE: <span style={{ color: 'var(--accent-green)' }}>{currentWireIndex + 1}/{totalWires}</span></span>
        <span>DONE: <span style={{ color: 'var(--accent-green)' }}>{wiresProcessed}</span></span>
        <span>STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span></span>
      </div>

      {/* Wire display */}
      <div style={{
        padding: '1rem 1.5rem',
        border: `2px solid ${colorStyle.border}`,
        background: colorStyle.bg,
        minWidth: '220px',
      }}>
        <p style={{ color: colorStyle.text, fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '4px', margin: '0 0 0.5rem 0' }}>
          {OCCURRENCE_LABELS[colorOccurrence]} {currentWire.color}
        </p>
        <div style={{
          height: '4px',
          background: colorStyle.border,
          margin: '0.5rem 0',
          boxShadow: `0 0 8px ${colorStyle.border}`,
        }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', letterSpacing: '3px', margin: '0.5rem 0 0 0' }}>
          PORT <span style={{ color: colorStyle.text, fontWeight: 'bold', fontSize: '1.1rem' }}>{currentWire.port}</span>
        </p>
      </div>

      {/* CUT / SKIP buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => handleDecide(true)}
          style={{
            width: '110px',
            height: '50px',
            background: 'rgba(255, 51, 51, 0.12)',
            border: '2px solid #ff3333',
            color: '#ff3333',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            letterSpacing: '3px',
            cursor: 'pointer',
          }}
        >
          CUT
        </button>
        <button
          onClick={() => handleDecide(false)}
          style={{
            width: '110px',
            height: '50px',
            background: 'rgba(0, 255, 136, 0.08)',
            border: '2px solid var(--accent-green)',
            color: 'var(--accent-green)',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            letterSpacing: '3px',
            cursor: 'pointer',
          }}
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
