import { useState, useEffect, useCallback } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { socketService } from '../../../services/socketService';
import { MAZE_GRID_SIZE } from '@abyssal-echo/shared';
import type { MazeIndicator } from '@abyssal-echo/shared';

const CELL_SIZE = 48;
const FLASH_DURATION = 400;

// Direction values matching server enum
const Direction = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 } as const;

export function MazeOperator() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const playerPosition = puzzleData.playerPosition as { row: number; col: number } | undefined;
  const goalPosition = puzzleData.goalPosition as { row: number; col: number } | undefined;
  const indicators = (puzzleData.indicators as MazeIndicator[] | undefined) ?? [];
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 3;
  const moveResult = puzzleData.moveResult as { hitWall: boolean; success: boolean } | undefined;

  const [flash, setFlash] = useState<'red' | 'green' | null>(null);

  // Flash on move result
  useEffect(() => {
    if (!moveResult) return;
    if (moveResult.hitWall) {
      setFlash('red');
    } else if (moveResult.success) {
      setFlash('green');
    }
    const timer = setTimeout(() => setFlash(null), FLASH_DURATION);
    return () => clearTimeout(timer);
  }, [moveResult, playerPosition?.row, playerPosition?.col]);

  const handleMove = useCallback((direction: number) => {
    socketService.send({ type: 'PUZZLE_ACTION', action: 'MOVE', value: direction });
  }, []);

  // Arrow key support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); handleMove(Direction.UP); break;
        case 'ArrowRight': e.preventDefault(); handleMove(Direction.RIGHT); break;
        case 'ArrowDown':  e.preventDefault(); handleMove(Direction.DOWN); break;
        case 'ArrowLeft':  e.preventDefault(); handleMove(Direction.LEFT); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove]);

  const gridSize = MAZE_GRID_SIZE;
  const totalSize = gridSize * CELL_SIZE;

  const flashBorder = flash === 'red'
    ? 'var(--accent-red)'
    : flash === 'green'
      ? 'var(--accent-green)'
      : 'rgba(0, 255, 136, 0.3)';

  const btnStyle = (label: string): React.CSSProperties => ({
    background: 'rgba(0, 255, 136, 0.08)',
    color: 'var(--accent-green)',
    border: '1px solid var(--accent-green)',
    padding: '10px 18px',
    fontSize: '0.8rem',
    letterSpacing: '3px',
    cursor: 'pointer',
    minWidth: '70px',
  });

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.75rem' }}>
        MAZE NAVIGATION
      </p>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        REPORT INDICATOR POSITIONS TO YOUR OBSERVER
      </p>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span></span>
      </div>

      <svg
        width={totalSize + 4}
        height={totalSize + 4}
        style={{
          border: `2px solid ${flashBorder}`,
          transition: 'border-color 0.15s',
          boxShadow: flash === 'red'
            ? '0 0 20px rgba(255, 51, 51, 0.4)'
            : flash === 'green'
              ? '0 0 20px rgba(0, 255, 136, 0.4)'
              : 'none',
        }}
      >
        {/* Grid lines only — no walls visible */}
        {Array.from({ length: gridSize + 1 }, (_, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={0} y1={i * CELL_SIZE}
              x2={totalSize} y2={i * CELL_SIZE}
              stroke="rgba(0, 255, 136, 0.1)"
              strokeWidth={1}
            />
            <line
              x1={i * CELL_SIZE} y1={0}
              x2={i * CELL_SIZE} y2={totalSize}
              stroke="rgba(0, 255, 136, 0.1)"
              strokeWidth={1}
            />
          </g>
        ))}

        {/* Indicator circles (green outlined circles identifying the maze) */}
        {indicators.map((ind, i) => (
          <circle
            key={`indicator-${i}`}
            cx={ind.col * CELL_SIZE + CELL_SIZE / 2}
            cy={ind.row * CELL_SIZE + CELL_SIZE / 2}
            r={CELL_SIZE / 3}
            fill="rgba(0, 255, 136, 0.15)"
            stroke="var(--accent-green)"
            strokeWidth={2.5}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.5))',
            }}
          />
        ))}

        {/* Goal marker (red triangle) */}
        {goalPosition && (
          <polygon
            points={`
              ${goalPosition.col * CELL_SIZE + CELL_SIZE / 2},${goalPosition.row * CELL_SIZE + 8}
              ${goalPosition.col * CELL_SIZE + CELL_SIZE - 8},${goalPosition.row * CELL_SIZE + CELL_SIZE - 8}
              ${goalPosition.col * CELL_SIZE + 8},${goalPosition.row * CELL_SIZE + CELL_SIZE - 8}
            `}
            fill="var(--accent-red)"
            opacity={0.8}
          />
        )}

        {/* Player position (green dot) */}
        {playerPosition && (
          <circle
            cx={playerPosition.col * CELL_SIZE + CELL_SIZE / 2}
            cy={playerPosition.row * CELL_SIZE + CELL_SIZE / 2}
            r={CELL_SIZE / 4}
            fill="var(--accent-green)"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.6))',
            }}
          />
        )}
      </svg>

      {/* Directional buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <button onClick={() => handleMove(Direction.UP)} style={btnStyle('UP')}>
          UP
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => handleMove(Direction.LEFT)} style={btnStyle('LEFT')}>
            LEFT
          </button>
          <button onClick={() => handleMove(Direction.DOWN)} style={btnStyle('DOWN')}>
            DOWN
          </button>
          <button onClick={() => handleMove(Direction.RIGHT)} style={btnStyle('RIGHT')}>
            RIGHT
          </button>
        </div>
      </div>
    </div>
  );
}
