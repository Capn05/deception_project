import {
  PlayerRole,
  MazeWall,
  MazeNavigationState,
  MazeIndicator,
  MAZE_GRID_SIZE,
  MAZE_MAX_STRIKES,
} from '@abyssal-echo/shared';

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

interface Position {
  row: number;
  col: number;
}

// Pre-defined maze layouts (6x6 grids)
// Walls are stored as { row, col, side: 'right' | 'bottom' }
// Outer borders are implicit
const MAZE_LAYOUTS: MazeWall[][] = [
  // Maze 0: Serpentine pattern
  [
    { row: 0, col: 0, side: 'bottom' },
    { row: 0, col: 1, side: 'bottom' },
    { row: 0, col: 2, side: 'bottom' },
    { row: 0, col: 3, side: 'bottom' },
    { row: 0, col: 3, side: 'right' },
    { row: 1, col: 1, side: 'right' },
    { row: 1, col: 4, side: 'bottom' },
    { row: 1, col: 5, side: 'bottom' },
    { row: 2, col: 0, side: 'right' },
    { row: 2, col: 1, side: 'bottom' },
    { row: 2, col: 2, side: 'bottom' },
    { row: 2, col: 3, side: 'bottom' },
    { row: 2, col: 3, side: 'right' },
    { row: 3, col: 1, side: 'right' },
    { row: 3, col: 4, side: 'bottom' },
    { row: 3, col: 5, side: 'bottom' },
    { row: 4, col: 0, side: 'right' },
    { row: 4, col: 1, side: 'bottom' },
    { row: 4, col: 2, side: 'bottom' },
    { row: 4, col: 3, side: 'right' },
  ],
  // Maze 1: Spiral inward
  [
    { row: 0, col: 4, side: 'bottom' },
    { row: 1, col: 0, side: 'bottom' },
    { row: 1, col: 1, side: 'bottom' },
    { row: 1, col: 2, side: 'bottom' },
    { row: 1, col: 3, side: 'bottom' },
    { row: 1, col: 4, side: 'right' },
    { row: 2, col: 0, side: 'right' },
    { row: 2, col: 2, side: 'right' },
    { row: 2, col: 3, side: 'bottom' },
    { row: 3, col: 0, side: 'right' },
    { row: 3, col: 2, side: 'bottom' },
    { row: 3, col: 4, side: 'bottom' },
    { row: 3, col: 4, side: 'right' },
    { row: 4, col: 1, side: 'right' },
    { row: 4, col: 2, side: 'right' },
    { row: 4, col: 3, side: 'bottom' },
    { row: 4, col: 4, side: 'bottom' },
    { row: 0, col: 1, side: 'right' },
    { row: 0, col: 2, side: 'right' },
  ],
  // Maze 2: Chambers
  [
    { row: 0, col: 1, side: 'bottom' },
    { row: 0, col: 2, side: 'right' },
    { row: 0, col: 4, side: 'bottom' },
    { row: 1, col: 0, side: 'right' },
    { row: 1, col: 2, side: 'bottom' },
    { row: 1, col: 3, side: 'right' },
    { row: 1, col: 4, side: 'right' },
    { row: 2, col: 0, side: 'bottom' },
    { row: 2, col: 1, side: 'right' },
    { row: 2, col: 3, side: 'bottom' },
    { row: 2, col: 4, side: 'bottom' },
    { row: 3, col: 1, side: 'bottom' },
    { row: 3, col: 2, side: 'right' },
    { row: 3, col: 4, side: 'right' },
    { row: 4, col: 0, side: 'right' },
    { row: 4, col: 2, side: 'bottom' },
    { row: 4, col: 3, side: 'bottom' },
    { row: 4, col: 4, side: 'right' },
  ],
  // Maze 3: Zigzag corridors
  [
    { row: 0, col: 0, side: 'right' },
    { row: 0, col: 2, side: 'bottom' },
    { row: 0, col: 3, side: 'right' },
    { row: 0, col: 4, side: 'bottom' },
    { row: 1, col: 1, side: 'bottom' },
    { row: 1, col: 2, side: 'right' },
    { row: 1, col: 4, side: 'right' },
    { row: 2, col: 0, side: 'right' },
    { row: 2, col: 1, side: 'right' },
    { row: 2, col: 3, side: 'bottom' },
    { row: 2, col: 4, side: 'bottom' },
    { row: 3, col: 0, side: 'bottom' },
    { row: 3, col: 2, side: 'right' },
    { row: 3, col: 3, side: 'right' },
    { row: 3, col: 5, side: 'bottom' },
    { row: 4, col: 1, side: 'right' },
    { row: 4, col: 2, side: 'bottom' },
    { row: 4, col: 3, side: 'bottom' },
    { row: 4, col: 4, side: 'right' },
  ],
  // Maze 4: Open center
  [
    { row: 0, col: 1, side: 'bottom' },
    { row: 0, col: 3, side: 'bottom' },
    { row: 0, col: 4, side: 'right' },
    { row: 1, col: 0, side: 'right' },
    { row: 1, col: 1, side: 'right' },
    { row: 1, col: 4, side: 'bottom' },
    { row: 2, col: 0, side: 'bottom' },
    { row: 2, col: 4, side: 'right' },
    { row: 2, col: 5, side: 'bottom' },
    { row: 3, col: 0, side: 'right' },
    { row: 3, col: 1, side: 'bottom' },
    { row: 3, col: 3, side: 'right' },
    { row: 3, col: 4, side: 'bottom' },
    { row: 4, col: 1, side: 'right' },
    { row: 4, col: 2, side: 'bottom' },
    { row: 4, col: 3, side: 'right' },
    { row: 4, col: 4, side: 'right' },
  ],
  // Maze 5: Blocky corridors
  [
    { row: 0, col: 0, side: 'bottom' },
    { row: 0, col: 2, side: 'right' },
    { row: 0, col: 3, side: 'bottom' },
    { row: 0, col: 5, side: 'bottom' },
    { row: 1, col: 1, side: 'right' },
    { row: 1, col: 2, side: 'bottom' },
    { row: 1, col: 4, side: 'right' },
    { row: 2, col: 0, side: 'right' },
    { row: 2, col: 2, side: 'right' },
    { row: 2, col: 3, side: 'right' },
    { row: 2, col: 5, side: 'bottom' },
    { row: 3, col: 1, side: 'bottom' },
    { row: 3, col: 3, side: 'bottom' },
    { row: 3, col: 4, side: 'right' },
    { row: 4, col: 0, side: 'right' },
    { row: 4, col: 2, side: 'right' },
    { row: 4, col: 3, side: 'right' },
    { row: 4, col: 4, side: 'bottom' },
  ],
  // Maze 6: Diagonal bias
  [
    { row: 0, col: 0, side: 'right' },
    { row: 0, col: 1, side: 'bottom' },
    { row: 0, col: 3, side: 'right' },
    { row: 0, col: 4, side: 'bottom' },
    { row: 1, col: 1, side: 'right' },
    { row: 1, col: 2, side: 'bottom' },
    { row: 1, col: 4, side: 'right' },
    { row: 2, col: 0, side: 'bottom' },
    { row: 2, col: 2, side: 'right' },
    { row: 2, col: 3, side: 'bottom' },
    { row: 2, col: 5, side: 'bottom' },
    { row: 3, col: 1, side: 'right' },
    { row: 3, col: 3, side: 'right' },
    { row: 3, col: 4, side: 'bottom' },
    { row: 4, col: 0, side: 'right' },
    { row: 4, col: 2, side: 'bottom' },
    { row: 4, col: 4, side: 'right' },
    { row: 4, col: 5, side: 'bottom' },
  ],
  // Maze 7: Labyrinth
  [
    { row: 0, col: 1, side: 'right' },
    { row: 0, col: 3, side: 'bottom' },
    { row: 0, col: 4, side: 'right' },
    { row: 1, col: 0, side: 'bottom' },
    { row: 1, col: 1, side: 'bottom' },
    { row: 1, col: 3, side: 'right' },
    { row: 1, col: 5, side: 'bottom' },
    { row: 2, col: 1, side: 'right' },
    { row: 2, col: 2, side: 'right' },
    { row: 2, col: 4, side: 'bottom' },
    { row: 3, col: 0, side: 'right' },
    { row: 3, col: 2, side: 'bottom' },
    { row: 3, col: 3, side: 'bottom' },
    { row: 3, col: 4, side: 'right' },
    { row: 4, col: 1, side: 'bottom' },
    { row: 4, col: 2, side: 'right' },
    { row: 4, col: 4, side: 'bottom' },
    { row: 4, col: 5, side: 'bottom' },
  ],
  // Maze 8: Cross pattern
  [
    { row: 0, col: 2, side: 'bottom' },
    { row: 0, col: 3, side: 'bottom' },
    { row: 1, col: 0, side: 'right' },
    { row: 1, col: 1, side: 'bottom' },
    { row: 1, col: 3, side: 'right' },
    { row: 1, col: 4, side: 'bottom' },
    { row: 2, col: 1, side: 'right' },
    { row: 2, col: 2, side: 'bottom' },
    { row: 2, col: 4, side: 'right' },
    { row: 3, col: 0, side: 'bottom' },
    { row: 3, col: 1, side: 'right' },
    { row: 3, col: 3, side: 'bottom' },
    { row: 3, col: 4, side: 'right' },
    { row: 4, col: 0, side: 'right' },
    { row: 4, col: 2, side: 'right' },
    { row: 4, col: 3, side: 'bottom' },
    { row: 4, col: 5, side: 'bottom' },
  ],
];

// Each maze has a unique pair of indicator positions (like KTANE green circles)
const MAZE_INDICATORS: MazeIndicator[][] = [
  [{ row: 0, col: 1 }, { row: 3, col: 4 }], // Maze 0
  [{ row: 1, col: 3 }, { row: 4, col: 1 }], // Maze 1
  [{ row: 3, col: 5 }, { row: 4, col: 2 }], // Maze 2
  [{ row: 0, col: 0 }, { row: 3, col: 3 }], // Maze 3
  [{ row: 0, col: 3 }, { row: 2, col: 5 }], // Maze 4
  [{ row: 2, col: 4 }, { row: 4, col: 1 }], // Maze 5
  [{ row: 1, col: 0 }, { row: 4, col: 3 }], // Maze 6
  [{ row: 0, col: 5 }, { row: 3, col: 2 }], // Maze 7
  [{ row: 1, col: 5 }, { row: 5, col: 0 }], // Maze 8
];

export class MazeNavigationPuzzle {
  private mazeIndex: number;
  private walls: MazeWall[];
  private playerPosition: Position;
  private goalPosition: Position;
  private strikes: number = 0;
  private reachedGoal: boolean = false;

  constructor() {
    // Pick a random maze layout
    this.mazeIndex = Math.floor(Math.random() * MAZE_LAYOUTS.length);
    this.walls = MAZE_LAYOUTS[this.mazeIndex];

    // Generate random start and goal positions (ensure they're not the same)
    this.playerPosition = this.randomPosition();
    do {
      this.goalPosition = this.randomPosition();
    } while (
      this.goalPosition.row === this.playerPosition.row &&
      this.goalPosition.col === this.playerPosition.col
    );

    // Verify reachability via BFS; if not reachable, pick new positions until valid
    let attempts = 0;
    while (!this.isReachable(this.playerPosition, this.goalPosition) && attempts < 50) {
      this.playerPosition = this.randomPosition();
      do {
        this.goalPosition = this.randomPosition();
      } while (
        this.goalPosition.row === this.playerPosition.row &&
        this.goalPosition.col === this.playerPosition.col
      );
      attempts++;
    }
  }

  getStateForRole(role: PlayerRole): Partial<MazeNavigationState> {
    const common = {
      gridSize: MAZE_GRID_SIZE,
      strikes: this.strikes,
      maxStrikes: MAZE_MAX_STRIKES,
      reachedGoal: this.reachedGoal,
    };

    if (role === PlayerRole.Observer) {
      // Observer sees all 9 maze diagrams with walls + indicators, but NO player/goal
      return {
        ...common,
        allMazes: MAZE_LAYOUTS.map((walls, i) => ({
          walls: [...walls],
          indicators: [...MAZE_INDICATORS[i]],
        })),
      };
    }

    // Operator sees blank grid with indicator circles, player position, and goal — no walls
    return {
      ...common,
      indicators: [...MAZE_INDICATORS[this.mazeIndex]],
      playerPosition: { ...this.playerPosition },
      goalPosition: { ...this.goalPosition },
    };
  }

  move(direction: Direction): { success: boolean; hitWall: boolean; reachedGoal: boolean; position: Position } {
    if (this.reachedGoal || this.strikes >= MAZE_MAX_STRIKES) {
      return { success: false, hitWall: false, reachedGoal: this.reachedGoal, position: { ...this.playerPosition } };
    }

    const { row, col } = this.playerPosition;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case Direction.UP:    newRow = row - 1; break;
      case Direction.RIGHT: newCol = col + 1; break;
      case Direction.DOWN:  newRow = row + 1; break;
      case Direction.LEFT:  newCol = col - 1; break;
    }

    // Check outer border
    if (newRow < 0 || newRow >= MAZE_GRID_SIZE || newCol < 0 || newCol >= MAZE_GRID_SIZE) {
      this.strikes++;
      return { success: false, hitWall: true, reachedGoal: false, position: { ...this.playerPosition } };
    }

    // Check internal walls
    if (this.hasWallBetween(row, col, newRow, newCol)) {
      this.strikes++;
      return { success: false, hitWall: true, reachedGoal: false, position: { ...this.playerPosition } };
    }

    // Valid move
    this.playerPosition = { row: newRow, col: newCol };

    // Check if reached goal
    if (newRow === this.goalPosition.row && newCol === this.goalPosition.col) {
      this.reachedGoal = true;
      return { success: true, hitWall: false, reachedGoal: true, position: { ...this.playerPosition } };
    }

    return { success: true, hitWall: false, reachedGoal: false, position: { ...this.playerPosition } };
  }

  isComplete(): boolean {
    return this.reachedGoal || this.strikes >= MAZE_MAX_STRIKES;
  }

  getResult(): { correct: boolean; strikes: number; maxStrikes: number } {
    return {
      correct: this.reachedGoal,
      strikes: this.strikes,
      maxStrikes: MAZE_MAX_STRIKES,
    };
  }

  private hasWallBetween(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    // Moving right: check right wall of current cell
    if (toCol === fromCol + 1) {
      return this.walls.some(w => w.row === fromRow && w.col === fromCol && w.side === 'right');
    }
    // Moving left: check right wall of target cell
    if (toCol === fromCol - 1) {
      return this.walls.some(w => w.row === fromRow && w.col === toCol && w.side === 'right');
    }
    // Moving down: check bottom wall of current cell
    if (toRow === fromRow + 1) {
      return this.walls.some(w => w.row === fromRow && w.col === fromCol && w.side === 'bottom');
    }
    // Moving up: check bottom wall of target cell
    if (toRow === fromRow - 1) {
      return this.walls.some(w => w.row === toRow && w.col === fromCol && w.side === 'bottom');
    }
    return false;
  }

  private randomPosition(): Position {
    return {
      row: Math.floor(Math.random() * MAZE_GRID_SIZE),
      col: Math.floor(Math.random() * MAZE_GRID_SIZE),
    };
  }

  private isReachable(start: Position, end: Position): boolean {
    const visited = new Set<string>();
    const queue: Position[] = [start];
    visited.add(`${start.row},${start.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.row === end.row && current.col === end.col) return true;

      const neighbors: [number, number][] = [
        [current.row - 1, current.col],
        [current.row + 1, current.col],
        [current.row, current.col - 1],
        [current.row, current.col + 1],
      ];

      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= MAZE_GRID_SIZE || nc < 0 || nc >= MAZE_GRID_SIZE) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        if (this.hasWallBetween(current.row, current.col, nr, nc)) continue;
        visited.add(key);
        queue.push({ row: nr, col: nc });
      }
    }
    return false;
  }
}
