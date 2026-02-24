import { useGameStore } from '../../state/gameStore';
import { GamePhase } from '@abyssal-echo/shared';
import { BatteryMeter } from './BatteryMeter';
import { DepthGauge } from './DepthGauge';
import { PTTButton } from '../voice/PTTButton';
import { VoiceStatusIndicator } from '../voice/VoiceStatusIndicator';
import { PuzzleContainer } from '../puzzles/PuzzleContainer';
import { CalibrationCapture } from '../voice/CalibrationCapture';
import { usePTT } from '../../hooks/usePTT';

export function HUDOverlay() {
  const { startTransmit, stopTransmit } = usePTT();
  const phase = useGameStore((s) => s.phase);
  const timerRemaining = useGameStore((s) => s.timerRemaining);
  const leviathanActive = useGameStore((s) => s.leviathanActive);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '50px',
      zIndex: 10,
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <DepthGauge />
        {phase === GamePhase.Playing && (
          <div style={{
            color: timerRemaining <= 10 ? 'var(--accent-red)' : 'var(--accent-amber)',
            fontSize: '1.8rem',
            letterSpacing: '4px',
          }}>
            {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:
            {String(timerRemaining % 60).padStart(2, '0')}
          </div>
        )}
        <BatteryMeter />
      </div>

      {/* Center content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {phase === GamePhase.Calibration && <CalibrationCapture />}
        {phase === GamePhase.Playing && <PuzzleContainer />}
        {phase === GamePhase.RoundEnd && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-amber)', fontSize: '1.5rem', letterSpacing: '4px' }}>
              ROUND COMPLETE
            </p>
          </div>
        )}
        {phase === GamePhase.GameOver && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-green)', fontSize: '2rem', letterSpacing: '4px' }}>
              MISSION COMPLETE
            </p>
          </div>
        )}
      </div>

      {/* Leviathan dev indicator */}
      {leviathanActive && (
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 0, 0, 0.15)',
          border: '1px solid var(--accent-red)',
          padding: '8px 24px',
          borderRadius: '4px',
          color: 'var(--accent-red)',
          fontSize: '0.8rem',
          letterSpacing: '4px',
          animation: 'pulse 0.5s ease-in-out infinite',
          zIndex: 100,
        }}>
          YOUR VOICE IS BEING INTERCEPTED
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', position: 'relative' }}>
        <PTTButton onStart={startTransmit} onStop={stopTransmit} />
        <div style={{ position: 'absolute', right: 'calc(50% + 60px)', bottom: '10px' }}>
          <VoiceStatusIndicator />
        </div>
      </div>
    </div>
  );
}
