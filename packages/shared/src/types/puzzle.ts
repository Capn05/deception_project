export enum PuzzleType {
  PressureMatch = 'PRESSURE_MATCH',
  WireRoute = 'WIRE_ROUTE',
  SequenceInput = 'SEQUENCE_INPUT',
  MazeNavigation = 'MAZE_NAVIGATION',
  WireSequence = 'WIRE_SEQUENCE',
}

export interface PressureMatchState {
  targetPressure: number;     // 100–999, visible to Observer only
  currentPressure: number;    // visible to Operator only
  tolerance: number;          // acceptable error margin
  timeLimit: number;          // seconds
  submitted: boolean;
}

export interface ValveRouteState {
  valves: { id: number; isOpen: boolean }[];   // current operator-controlled state
  targetStates: Record<number, boolean>;        // correct open/closed per valve (Observer only)
  valveCount: number;
  submitted: boolean;
}

export type SimonColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export interface SimonColorMappings {
  shallow: Record<number, Record<SimonColor, SimonColor>>;
  deep: Record<number, Record<SimonColor, SimonColor>>;
}

export interface SimonSaysState {
  isDeep?: boolean;                      // Operator only
  currentFlashSequence?: SimonColor[];   // Operator only
  currentStage?: number;                 // Operator only (1-based)
  inputProgress?: number;                // Operator only
  colorMappings?: SimonColorMappings;    // Observer only
  strikes: number;
  maxStrikes: number;
  totalStages: number;
  completed: boolean;
}

export interface MazeWall {
  row: number;
  col: number;
  side: 'right' | 'bottom';
}

export interface MazeIndicator {
  row: number;
  col: number;
}

export interface MazeDiagram {
  walls: MazeWall[];
  indicators: MazeIndicator[];
}

export interface MazeNavigationState {
  gridSize: number;
  // Operator only: the two indicator circles identifying the active maze
  indicators?: MazeIndicator[];
  // Observer only: all 9 maze diagrams to scroll through
  allMazes?: MazeDiagram[];
  // Operator only
  playerPosition?: { row: number; col: number };
  goalPosition?: { row: number; col: number };
  strikes: number;
  maxStrikes: number;
  reachedGoal: boolean;
}

export type WireColor = 'RED' | 'BLUE' | 'BLACK';
export type WirePort = 'A' | 'B' | 'C';

export interface WireSequenceCutChart {
  RED: Record<number, Record<WirePort, boolean>>;
  BLUE: Record<number, Record<WirePort, boolean>>;
  BLACK: Record<number, Record<WirePort, boolean>>;
}

export interface WireSequenceState {
  // Operator only
  currentWire?: { color: WireColor; port: WirePort };
  currentWireIndex?: number;
  colorOccurrence?: number;
  // Observer only
  cutChart?: WireSequenceCutChart;
  // Shared
  totalWires: number;
  wiresProcessed: number;
  strikes: number;
  maxStrikes: number;
  completed: boolean;
}
