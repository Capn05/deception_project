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

export interface ValveRouteState {
  valves: { id: number; isOpen: boolean }[];   // current operator-controlled state
  targetStates: Record<number, boolean>;        // correct open/closed per valve (Observer only)
  valveCount: number;
  submitted: boolean;
}

export interface SequenceState {
  sequence: number[];
  playerInput: number[];
  currentStep: number;
}
