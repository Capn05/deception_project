import { usePuzzleStore } from '../../../state/puzzleStore';
import { GlowText } from '../../shared/GlowText';

export function PressureReader() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const targetPressure = puzzleData.targetPressure as number | undefined;
  const tolerance = puzzleData.tolerance as number | undefined;

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.8rem' }}>
        TARGET PRESSURE READING
      </p>
      <div style={{
        border: '2px solid var(--accent-green)',
        padding: '24px 48px',
        background: 'rgba(0, 255, 136, 0.05)',
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.1), inset 0 0 20px rgba(0, 255, 136, 0.05)',
      }}>
        <GlowText size="3rem" color="var(--accent-green)">
          {targetPressure ?? '---'}
        </GlowText>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
        TOLERANCE: +/- {tolerance ?? '?'}
      </p>
      <p style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', letterSpacing: '2px', maxWidth: '300px' }}>
        COMMUNICATE THIS VALUE TO YOUR OPERATOR VIA RADIO
      </p>
    </div>
  );
}
