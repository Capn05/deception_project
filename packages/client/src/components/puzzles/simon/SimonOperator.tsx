import { useState, useEffect, useCallback, useRef } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { socketService } from '../../../services/socketService';
import { SIMON_FLASH_DURATION_MS, SIMON_FLASH_GAP_MS } from '@abyssal-echo/shared';
import type { SimonColor } from '@abyssal-echo/shared';

const COLORS: { label: SimonColor; bg: string; border: string; glow: string }[] = [
  { label: 'RED', bg: 'rgba(255, 51, 51, 0.15)', border: '#ff3333', glow: 'rgba(255, 51, 51, 0.6)' },
  { label: 'BLUE', bg: 'rgba(51, 102, 255, 0.15)', border: '#3366ff', glow: 'rgba(51, 102, 255, 0.6)' },
  { label: 'GREEN', bg: 'rgba(0, 255, 136, 0.15)', border: '#00ff88', glow: 'rgba(0, 255, 136, 0.6)' },
  { label: 'YELLOW', bg: 'rgba(255, 221, 51, 0.15)', border: '#ffdd33', glow: 'rgba(255, 221, 51, 0.6)' },
];

const ACTIVE_COLORS: Record<SimonColor, { bg: string; glow: string }> = {
  RED: { bg: 'rgba(255, 51, 51, 0.6)', glow: '0 0 30px rgba(255, 51, 51, 0.8)' },
  BLUE: { bg: 'rgba(51, 102, 255, 0.6)', glow: '0 0 30px rgba(51, 102, 255, 0.8)' },
  GREEN: { bg: 'rgba(0, 255, 136, 0.6)', glow: '0 0 30px rgba(0, 255, 136, 0.8)' },
  YELLOW: { bg: 'rgba(255, 221, 51, 0.6)', glow: '0 0 30px rgba(255, 221, 51, 0.8)' },
};

export function SimonOperator() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const isDeep = puzzleData.isDeep as boolean | undefined;
  const currentFlashSequence = (puzzleData.currentFlashSequence as SimonColor[] | undefined) ?? [];
  const currentStage = (puzzleData.currentStage as number | undefined) ?? 1;
  const inputProgress = (puzzleData.inputProgress as number | undefined) ?? 0;
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 3;
  const totalStages = (puzzleData.totalStages as number | undefined) ?? 5;

  const [activeFlash, setActiveFlash] = useState<SimonColor | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const playFlashSequence = useCallback(() => {
    // Clear previous timeouts
    flashTimeoutRef.current.forEach(clearTimeout);
    flashTimeoutRef.current = [];

    if (currentFlashSequence.length === 0) return;

    setIsFlashing(true);
    const totalFlashTime = SIMON_FLASH_DURATION_MS + SIMON_FLASH_GAP_MS;

    currentFlashSequence.forEach((color, i) => {
      const onTimer = setTimeout(() => setActiveFlash(color), i * totalFlashTime);
      flashTimeoutRef.current.push(onTimer);

      const offTimer = setTimeout(() => setActiveFlash(null), i * totalFlashTime + SIMON_FLASH_DURATION_MS);
      flashTimeoutRef.current.push(offTimer);
    });

    const doneTimer = setTimeout(() => setIsFlashing(false), currentFlashSequence.length * totalFlashTime);
    flashTimeoutRef.current.push(doneTimer);
  }, [currentFlashSequence]);

  // Auto-play when stage changes or sequence updates
  useEffect(() => {
    playFlashSequence();
    return () => {
      flashTimeoutRef.current.forEach(clearTimeout);
      flashTimeoutRef.current = [];
    };
  }, [currentFlashSequence.length, currentStage, strikes]);

  const handlePress = useCallback((colorIndex: number) => {
    if (isFlashing) return;
    socketService.send({ type: 'PUZZLE_ACTION', action: 'PRESS', value: colorIndex });
  }, [isFlashing]);

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.75rem', margin: 0 }}>
        SIMON SAYS
      </p>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        REPORT FLASHES AND DEPTH ZONE TO YOUR OBSERVER
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>DEPTH: <span style={{
          color: isDeep ? 'var(--accent-red)' : 'var(--accent-green)',
          fontWeight: 'bold',
        }}>{isDeep ? 'DEEP' : 'SHALLOW'}</span></span>
        <span>STAGE: <span style={{ color: 'var(--accent-green)' }}>{currentStage}/{totalStages}</span></span>
        <span>STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span></span>
      </div>

      {/* Input progress dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {Array.from({ length: currentStage }, (_, i) => (
          <div key={i} style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: i < inputProgress ? 'var(--accent-green)' : 'rgba(0, 255, 136, 0.2)',
            border: '1px solid var(--accent-green)',
            boxShadow: i < inputProgress ? '0 0 6px rgba(0, 255, 136, 0.5)' : 'none',
          }} />
        ))}
      </div>

      {/* 2x2 color grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        width: '240px',
      }}>
        {COLORS.map((color, i) => {
          const isActive = activeFlash === color.label;
          const activeStyle = isActive ? ACTIVE_COLORS[color.label] : null;

          return (
            <button
              key={color.label}
              onClick={() => handlePress(i)}
              disabled={isFlashing}
              style={{
                width: '112px',
                height: '90px',
                background: activeStyle ? activeStyle.bg : color.bg,
                border: `2px solid ${color.border}`,
                color: color.border,
                fontSize: '0.8rem',
                fontWeight: 'bold',
                letterSpacing: '3px',
                cursor: isFlashing ? 'not-allowed' : 'pointer',
                boxShadow: activeStyle ? activeStyle.glow : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
                opacity: isFlashing && !isActive ? 0.5 : 1,
              }}
            >
              {color.label}
            </button>
          );
        })}
      </div>

      {isFlashing ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px', margin: 0 }}>
          WATCH THE SEQUENCE...
        </p>
      ) : (
        <button
          onClick={playFlashSequence}
          style={{
            background: 'rgba(0, 255, 136, 0.08)',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)',
            padding: '6px 16px',
            fontSize: '0.7rem',
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
        >
          REPLAY SEQUENCE
        </button>
      )}
    </div>
  );
}
