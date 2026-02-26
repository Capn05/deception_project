import { useGameStore } from '../../state/gameStore';
import { usePuzzleStore } from '../../state/puzzleStore';
import { PlayerRole, PuzzleType } from '@abyssal-echo/shared';
import { PressureReader } from './pressure/PressureReader';
import { PressureDial } from './pressure/PressureDial';
import { ValveSchematic } from './valveroute/ValveSchematic';
import { ValvePanel } from './valveroute/ValvePanel';

export function PuzzleContainer() {
  const role = useGameStore((s) => s.role);
  const puzzleType = usePuzzleStore((s) => s.puzzleType);
  const lastResult = usePuzzleStore((s) => s.lastResult);

  if (lastResult) {
    const isValveRoute = lastResult.tolerance === 0;
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{
          color: lastResult.correct ? 'var(--accent-green)' : 'var(--accent-red)',
          fontSize: '1.5rem',
          letterSpacing: '4px',
          marginBottom: '1rem',
        }}>
          {isValveRoute
            ? (lastResult.correct ? 'ROUTING CONFIRMED' : 'ROUTING FAILED')
            : (lastResult.correct ? 'MATCH CONFIRMED' : 'MISMATCH DETECTED')}
        </p>
        <p style={{ color: 'var(--text-dim)' }}>
          {isValveRoute
            ? `Valves correct: ${lastResult.submittedValue} / ${lastResult.targetValue}`
            : `Target: ${lastResult.targetValue} | Submitted: ${lastResult.submittedValue} | Tolerance: +/-${lastResult.tolerance}`}
        </p>
      </div>
    );
  }

  if (puzzleType === PuzzleType.PressureMatch) {
    if (role === PlayerRole.Observer) return <PressureReader />;
    if (role === PlayerRole.Operator) return <PressureDial />;
  }

  if (puzzleType === PuzzleType.WireRoute) {
    if (role === PlayerRole.Observer) return <ValveSchematic />;
    if (role === PlayerRole.Operator) return <ValvePanel />;
  }

  return (
    <p style={{ color: 'var(--text-dim)', letterSpacing: '3px' }}>
      AWAITING PUZZLE DATA...
    </p>
  );
}
