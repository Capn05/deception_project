import { useGameStore } from '../../state/gameStore';
import { usePuzzleStore } from '../../state/puzzleStore';
import { PlayerRole, PuzzleType } from '@abyssal-echo/shared';
import { PressureReader } from './pressure/PressureReader';
import { PressureDial } from './pressure/PressureDial';

export function PuzzleContainer() {
  const role = useGameStore((s) => s.role);
  const puzzleType = usePuzzleStore((s) => s.puzzleType);
  const lastResult = usePuzzleStore((s) => s.lastResult);

  if (lastResult) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{
          color: lastResult.correct ? 'var(--accent-green)' : 'var(--accent-red)',
          fontSize: '1.5rem',
          letterSpacing: '4px',
          marginBottom: '1rem',
        }}>
          {lastResult.correct ? 'MATCH CONFIRMED' : 'MISMATCH DETECTED'}
        </p>
        <p style={{ color: 'var(--text-dim)' }}>
          Target: {lastResult.targetValue} | Submitted: {lastResult.submittedValue} | Tolerance: +/-{lastResult.tolerance}
        </p>
      </div>
    );
  }

  if (puzzleType === PuzzleType.PressureMatch) {
    if (role === PlayerRole.Observer) return <PressureReader />;
    if (role === PlayerRole.Operator) return <PressureDial />;
  }

  return (
    <p style={{ color: 'var(--text-dim)', letterSpacing: '3px' }}>
      AWAITING PUZZLE DATA...
    </p>
  );
}
