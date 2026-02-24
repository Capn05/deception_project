export enum PuzzleType {
  PressureMatch = 'PRESSURE_MATCH',
  WireRoute = 'WIRE_ROUTE',
  SequenceInput = 'SEQUENCE_INPUT',
}

export interface PressureMatchState {
  targetPressure: number;     // 100–999, visible to Observer only
  currentPressure: number;    // visible to Operator only
  tolerance: number;          // acceptable error margin
  timeLimit: number;          // seconds
  submitted: boolean;
}

// Phase 2 stubs
export interface WireRouteState {
  connections: Array<{ from: string; to: string }>;
  correctRoute: string[];
  playerRoute: string[];
}

export interface SequenceState {
  sequence: number[];
  playerInput: number[];
  currentStep: number;
}
