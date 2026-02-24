import {
  PlayerRole,
  PressureMatchState,
  PRESSURE_MIN,
  PRESSURE_MAX,
  PRESSURE_TOLERANCE,
  PUZZLE_TIME_LIMIT,
} from '@abyssal-echo/shared';

export class PressureMatchPuzzle {
  private state: PressureMatchState;

  constructor() {
    this.state = {
      targetPressure: Math.floor(Math.random() * (PRESSURE_MAX - PRESSURE_MIN + 1)) + PRESSURE_MIN,
      currentPressure: Math.floor((PRESSURE_MIN + PRESSURE_MAX) / 2),
      tolerance: PRESSURE_TOLERANCE,
      timeLimit: PUZZLE_TIME_LIMIT,
      submitted: false,
    };
  }

  getStateForRole(role: PlayerRole): Partial<PressureMatchState> {
    if (role === PlayerRole.Observer) {
      return {
        targetPressure: this.state.targetPressure,
        tolerance: this.state.tolerance,
        timeLimit: this.state.timeLimit,
      };
    }
    // Operator sees current pressure but NOT the target
    return {
      currentPressure: this.state.currentPressure,
      tolerance: this.state.tolerance,
      timeLimit: this.state.timeLimit,
    };
  }

  setCurrentPressure(value: number) {
    this.state.currentPressure = Math.max(PRESSURE_MIN, Math.min(PRESSURE_MAX, value));
  }

  getCurrentPressure(): number {
    return this.state.currentPressure;
  }

  getTargetPressure(): number {
    return this.state.targetPressure;
  }

  checkAnswer(submittedValue: number): {
    correct: boolean;
    targetValue: number;
    submittedValue: number;
    tolerance: number;
  } {
    this.state.submitted = true;
    const diff = Math.abs(submittedValue - this.state.targetPressure);
    return {
      correct: diff <= this.state.tolerance,
      targetValue: this.state.targetPressure,
      submittedValue,
      tolerance: this.state.tolerance,
    };
  }
}
