import { useGameStore } from '../../state/gameStore';
import { socketService } from '../../services/socketService';
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
  const partnered = useGameStore((s) => s.partnered);
  const leaveGame = useGameStore((s) => s.leaveGame);

  const handleLeave = () => {
    socketService.send({ type: 'LEAVE_GAME' });
    leaveGame();
  };

  const showDisconnectOverlay = !partnered && (
    phase === GamePhase.Calibration ||
    phase === GamePhase.Playing ||
    phase === GamePhase.RoundEnd
  );

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
      {/* Leave button */}
      <button
        onClick={handleLeave}
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'var(--text-dim)',
          border: '1px solid var(--text-dim)',
          padding: '6px 16px',
          fontSize: '0.7rem',
          letterSpacing: '3px',
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        LEAVE
      </button>

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

      {/* Partner disconnected overlay */}
      {showDisconnectOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          zIndex: 200,
        }}>
          <p style={{
            color: 'var(--accent-red)',
            fontSize: '1.8rem',
            letterSpacing: '6px',
            textShadow: '0 0 20px rgba(255, 0, 0, 0.4)',
          }}>
            PARTNER DISCONNECTED
          </p>
          <button
            onClick={handleLeave}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--accent-amber)',
              border: '1px solid var(--accent-amber)',
              padding: '12px 32px',
              fontSize: '1rem',
              letterSpacing: '3px',
              cursor: 'pointer',
            }}
          >
            RETURN TO LOBBY
          </button>
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
