import { useGameStore } from '../../state/gameStore';
import { usePuzzleStore } from '../../state/puzzleStore';
import { PlayerRole, PuzzleType } from '@abyssal-echo/shared';
import { PressureReader } from './pressure/PressureReader';
import { PressureDial } from './pressure/PressureDial';
import { ValveSchematic } from './valveroute/ValveSchematic';
import { ValvePanel } from './valveroute/ValvePanel';
import { MazeObserver } from './maze/MazeObserver';
import { MazeOperator } from './maze/MazeOperator';
import { SimonObserver } from './simon/SimonObserver';
import { SimonOperator } from './simon/SimonOperator';
import { WireSequenceObserver } from './wiresequence/WireSequenceObserver';
import { WireSequenceOperator } from './wiresequence/WireSequenceOperator';

export function PuzzleContainer() {
  const role = useGameStore((s) => s.role);
  const puzzleType = usePuzzleStore((s) => s.puzzleType);
  const lastResult = usePuzzleStore((s) => s.lastResult);

  if (lastResult) {
    const isWireSequence = lastResult.tolerance === -3;
    const isSimon = lastResult.tolerance === -2;
    const isMaze = lastResult.tolerance === -1;
    const isValveRoute = lastResult.tolerance === 0;
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{
          color: lastResult.correct ? 'var(--accent-green)' : 'var(--accent-red)',
          fontSize: '1.5rem',
          letterSpacing: '4px',
          marginBottom: '1rem',
        }}>
          {isWireSequence
            ? (lastResult.correct ? 'WIRES VERIFIED' : 'WIRES FAILED')
            : isSimon
              ? (lastResult.correct ? 'SEQUENCE COMPLETE' : 'SEQUENCE FAILED')
              : isMaze
                ? (lastResult.correct ? 'MAZE NAVIGATED' : 'NAVIGATION FAILED')
                : isValveRoute
                  ? (lastResult.correct ? 'ROUTING CONFIRMED' : 'ROUTING FAILED')
                  : (lastResult.correct ? 'MATCH CONFIRMED' : 'MISMATCH DETECTED')}
        </p>
        <p style={{ color: 'var(--text-dim)' }}>
          {isWireSequence
            ? `Wires: ${lastResult.submittedValue} / ${lastResult.targetValue}`
            : isSimon
              ? `Stages: ${lastResult.submittedValue} / ${lastResult.targetValue}`
              : isMaze
                ? `Strikes: ${lastResult.submittedValue} / ${lastResult.targetValue}`
                : isValveRoute
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

  if (puzzleType === PuzzleType.MazeNavigation) {
    if (role === PlayerRole.Observer) return <MazeObserver />;
    if (role === PlayerRole.Operator) return <MazeOperator />;
  }

  if (puzzleType === PuzzleType.SequenceInput) {
    if (role === PlayerRole.Observer) return <SimonObserver />;
    if (role === PlayerRole.Operator) return <SimonOperator />;
  }

  if (puzzleType === PuzzleType.WireSequence) {
    if (role === PlayerRole.Observer) return <WireSequenceObserver />;
    if (role === PlayerRole.Operator) return <WireSequenceOperator />;
  }

  return (
    <p style={{ color: 'var(--text-dim)', letterSpacing: '3px' }}>
      AWAITING PUZZLE DATA...
    </p>
  );
}
