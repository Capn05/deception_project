import { useState } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { socketService } from '../../../services/socketService';
import { PRESSURE_MIN, PRESSURE_MAX } from '@abyssal-echo/shared';
import { GlowText } from '../../shared/GlowText';

export function PressureDial() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const [localValue, setLocalValue] = useState((puzzleData.currentPressure as number | undefined) ?? 500);

  const handleChange = (value: number) => {
    setLocalValue(value);
    socketService.send({ type: 'PUZZLE_ACTION', action: 'ADJUST', value });
  };

  const handleSubmit = () => {
    socketService.send({ type: 'PUZZLE_ACTION', action: 'SUBMIT', value: localValue });
  };

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.8rem' }}>
        PRESSURE CONTROL
      </p>

      <div style={{
        border: '2px solid var(--accent-amber)',
        padding: '24px 48px',
        background: 'rgba(255, 170, 0, 0.05)',
        boxShadow: '0 0 20px rgba(255, 170, 0, 0.1)',
      }}>
        <GlowText size="3rem" color="var(--accent-amber)">
          {localValue}
        </GlowText>
      </div>

      <input
        type="range"
        min={PRESSURE_MIN}
        max={PRESSURE_MAX}
        value={localValue}
        onChange={(e) => handleChange(parseInt(e.target.value, 10))}
        style={{
          width: '300px',
          accentColor: 'var(--accent-amber)',
        }}
      />

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => handleChange(Math.max(PRESSURE_MIN, localValue - 10))}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--accent-amber)',
            border: '1px solid var(--accent-amber)',
            padding: '8px 16px',
            fontSize: '1rem',
          }}
        >
          -10
        </button>
        <button
          onClick={() => handleChange(Math.max(PRESSURE_MIN, localValue - 1))}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--accent-amber)',
            border: '1px solid var(--accent-amber)',
            padding: '8px 16px',
            fontSize: '1rem',
          }}
        >
          -1
        </button>
        <button
          onClick={() => handleChange(Math.min(PRESSURE_MAX, localValue + 1))}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--accent-amber)',
            border: '1px solid var(--accent-amber)',
            padding: '8px 16px',
            fontSize: '1rem',
          }}
        >
          +1
        </button>
        <button
          onClick={() => handleChange(Math.min(PRESSURE_MAX, localValue + 10))}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--accent-amber)',
            border: '1px solid var(--accent-amber)',
            padding: '8px 16px',
            fontSize: '1rem',
          }}
        >
          +10
        </button>
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
          marginTop: '1rem',
          boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)',
        }}
      >
        SUBMIT
      </button>

      <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
        TOLERANCE: +/- {(puzzleData.tolerance as number | undefined) ?? '?'}
      </p>
    </div>
  );
}
