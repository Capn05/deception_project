import { PlayerRole, PuzzleType, PUZZLE_TIME_LIMIT } from '@abyssal-echo/shared';
import { GameRoom } from '../rooms/GameRoom.js';
import { PressureMatchPuzzle } from './puzzles/PressureMatchPuzzle.js';

export class PuzzleOrchestrator {
  private currentPuzzle: PressureMatchPuzzle | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeRemaining = PUZZLE_TIME_LIMIT;

  constructor(private room: GameRoom) {}

  startPuzzle() {
    this.currentPuzzle = new PressureMatchPuzzle();
    this.timeRemaining = PUZZLE_TIME_LIMIT;

    // Send role-filtered state
    const observerState = this.currentPuzzle.getStateForRole(PlayerRole.Observer);
    const operatorState = this.currentPuzzle.getStateForRole(PlayerRole.Operator);

    this.room.broadcastToRole(PlayerRole.Observer, {
      type: 'PUZZLE_STATE',
      puzzleType: PuzzleType.PressureMatch,
      state: observerState,
    });

    this.room.broadcastToRole(PlayerRole.Operator, {
      type: 'PUZZLE_STATE',
      puzzleType: PuzzleType.PressureMatch,
      state: operatorState,
    });

    this.startTimer();
  }

  handleAction(playerId: string, action: string, value: number): boolean {
    if (!this.currentPuzzle) return false;

    const role = this.room.getPlayerRole(playerId);
    if (role !== PlayerRole.Operator) return false;

    if (action === 'SUBMIT') {
      this.stopTimer();
      const result = this.currentPuzzle.checkAnswer(value);
      this.room.broadcast({
        type: 'PUZZLE_RESULT',
        correct: result.correct,
        targetValue: result.targetValue,
        submittedValue: result.submittedValue,
        tolerance: result.tolerance,
      });
      return true;
    }

    if (action === 'ADJUST') {
      this.currentPuzzle.setCurrentPressure(value);
      // Send updated state to operator only
      this.room.broadcastToRole(PlayerRole.Operator, {
        type: 'PUZZLE_STATE',
        puzzleType: PuzzleType.PressureMatch,
        state: this.currentPuzzle.getStateForRole(PlayerRole.Operator),
      });
    }

    return false;
  }

  getCurrentPuzzleInfo(): { puzzleType: string; targetValue?: number } | null {
    if (!this.currentPuzzle) return null;
    return {
      puzzleType: PuzzleType.PressureMatch,
      targetValue: this.currentPuzzle.getTargetPressure(),
    };
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.room.broadcast({ type: 'TIMER_UPDATE', remaining: this.timeRemaining });
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        // Auto-submit with current value
        if (this.currentPuzzle) {
          const result = this.currentPuzzle.checkAnswer(this.currentPuzzle.getCurrentPressure());
          this.room.broadcast({
            type: 'PUZZLE_RESULT',
            correct: result.correct,
            targetValue: result.targetValue,
            submittedValue: result.submittedValue,
            tolerance: result.tolerance,
          });
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
