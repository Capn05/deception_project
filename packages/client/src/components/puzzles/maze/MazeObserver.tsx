import { useState } from 'react';
import { usePuzzleStore } from '../../../state/puzzleStore';
import { MAZE_GRID_SIZE } from '@abyssal-echo/shared';
import type { MazeDiagram } from '@abyssal-echo/shared';

const CELL_SIZE = 48;
const WALL_WIDTH = 3;

export function MazeObserver() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const [selectedMaze, setSelectedMaze] = useState(0);

  const allMazes = (puzzleData.allMazes as MazeDiagram[] | undefined) ?? [];
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 3;

  const gridSize = MAZE_GRID_SIZE;
  const totalSize = gridSize * CELL_SIZE;
  const mazeCount = allMazes.length;
  const currentMaze = allMazes[selectedMaze];

  const prevMaze = () => setSelectedMaze((i) => (i - 1 + mazeCount) % mazeCount);
  const nextMaze = () => setSelectedMaze((i) => (i + 1) % mazeCount);

  const navBtnStyle: React.CSSProperties = {
    background: 'rgba(0, 255, 136, 0.08)',
    color: 'var(--accent-green)',
    border: '1px solid var(--accent-green)',
    padding: '8px 16px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    letterSpacing: '2px',
    minWidth: '44px',
  };

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        MATCH INDICATORS TO FIND THE CORRECT MAZE
      </p>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span></span>
      </div>

      {/* Maze selector nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={prevMaze} style={navBtnStyle}>&lt;</button>
        <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem', letterSpacing: '3px', minWidth: '90px' }}>
          MAZE {selectedMaze + 1}/{mazeCount}
        </span>
        <button onClick={nextMaze} style={navBtnStyle}>&gt;</button>
      </div>

      {/* Maze diagram */}
      {currentMaze && (
        <svg
          width={totalSize + WALL_WIDTH * 2}
          height={totalSize + WALL_WIDTH * 2}
          style={{ border: `${WALL_WIDTH}px solid var(--accent-green)` }}
        >
          {/* Grid lines (faint) */}
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

          {/* Internal walls */}
          {currentMaze.walls.map((wall, i) => {
            const x = wall.col * CELL_SIZE;
            const y = wall.row * CELL_SIZE;

            if (wall.side === 'right') {
              return (
                <line
                  key={`wall-${i}`}
                  x1={x + CELL_SIZE} y1={y}
                  x2={x + CELL_SIZE} y2={y + CELL_SIZE}
                  stroke="var(--accent-green)"
                  strokeWidth={WALL_WIDTH}
                  strokeLinecap="round"
                />
              );
            }
            return (
              <line
                key={`wall-${i}`}
                x1={x} y1={y + CELL_SIZE}
                x2={x + CELL_SIZE} y2={y + CELL_SIZE}
                stroke="var(--accent-green)"
                strokeWidth={WALL_WIDTH}
                strokeLinecap="round"
              />
            );
          })}

          {/* Indicator circles (green outlined circles) */}
          {currentMaze.indicators.map((ind, i) => (
            <circle
              key={`indicator-${i}`}
              cx={ind.col * CELL_SIZE + CELL_SIZE / 2}
              cy={ind.row * CELL_SIZE + CELL_SIZE / 2}
              r={CELL_SIZE / 3}
              fill="none"
              stroke="var(--accent-green)"
              strokeWidth={2.5}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.5))',
              }}
            />
          ))}
        </svg>
      )}

      <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px', maxWidth: '320px', margin: 0 }}>
        ASK YOUR OPERATOR FOR INDICATOR POSITIONS
      </p>
    </div>
  );
}
