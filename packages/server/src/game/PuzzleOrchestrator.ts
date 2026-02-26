import { PlayerRole, PuzzleType, PUZZLE_TIME_LIMIT } from '@abyssal-echo/shared';
import { GameRoom } from '../rooms/GameRoom.js';
import { PressureMatchPuzzle } from './puzzles/PressureMatchPuzzle.js';
import { ValveRoutePuzzle } from './puzzles/ValveRoutePuzzle.js';

type AnyPuzzle = PressureMatchPuzzle | ValveRoutePuzzle;

export class PuzzleOrchestrator {
  private currentPuzzle: AnyPuzzle | null = null;
  private currentPuzzleType: PuzzleType | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeRemaining = PUZZLE_TIME_LIMIT;

  constructor(private room: GameRoom) {}

  startPuzzle() {
    // 50/50 random puzzle selection
    if (Math.random() < 0.5) {
      this.currentPuzzle = new PressureMatchPuzzle();
      this.currentPuzzleType = PuzzleType.PressureMatch;
    } else {
      this.currentPuzzle = new ValveRoutePuzzle();
      this.currentPuzzleType = PuzzleType.WireRoute;
    }

    this.timeRemaining = PUZZLE_TIME_LIMIT;

    const observerState = this.currentPuzzle.getStateForRole(PlayerRole.Observer);
    const operatorState = this.currentPuzzle.getStateForRole(PlayerRole.Operator);

    this.room.broadcastToRole(PlayerRole.Observer, {
      type: 'PUZZLE_STATE',
      puzzleType: this.currentPuzzleType,
      state: observerState,
    });

    this.room.broadcastToRole(PlayerRole.Operator, {
      type: 'PUZZLE_STATE',
      puzzleType: this.currentPuzzleType,
      state: operatorState,
    });

    this.startTimer();
  }

  handleAction(playerId: string, action: string, value: number): boolean {
    if (!this.currentPuzzle) return false;

    const role = this.room.getPlayerRole(playerId);
    if (role !== PlayerRole.Operator) return false;

    if (this.currentPuzzleType === PuzzleType.WireRoute) {
      const puzzle = this.currentPuzzle as ValveRoutePuzzle;

      if (action === 'TOGGLE') {
        puzzle.toggleValve(value);
        this.room.broadcastToRole(PlayerRole.Operator, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.WireRoute,
          state: puzzle.getStateForRole(PlayerRole.Operator),
        });
        return false;
      }

      if (action === 'SUBMIT') {
        this.stopTimer();
        const result = puzzle.checkAnswer();
        this.room.broadcast({
          type: 'PUZZLE_RESULT',
          correct: result.correct,
          targetValue: result.totalCount,
          submittedValue: result.correctCount,
          tolerance: 0,
        });
        return true;
      }

      return false;
    }

    // PressureMatch
    const puzzle = this.currentPuzzle as PressureMatchPuzzle;

    if (action === 'SUBMIT') {
      this.stopTimer();
      const result = puzzle.checkAnswer(value);
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
      puzzle.setCurrentPressure(value);
      this.room.broadcastToRole(PlayerRole.Operator, {
        type: 'PUZZLE_STATE',
        puzzleType: PuzzleType.PressureMatch,
        state: puzzle.getStateForRole(PlayerRole.Operator),
      });
    }

    return false;
  }

  getCurrentPuzzleInfo(): { puzzleType: string; targetValue?: number } | null {
    if (!this.currentPuzzle || !this.currentPuzzleType) return null;

    if (this.currentPuzzleType === PuzzleType.WireRoute) {
      return { puzzleType: PuzzleType.WireRoute };
    }

    const puzzle = this.currentPuzzle as PressureMatchPuzzle;
    return {
      puzzleType: PuzzleType.PressureMatch,
      targetValue: puzzle.getTargetPressure(),
    };
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.room.broadcast({ type: 'TIMER_UPDATE', remaining: this.timeRemaining });
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        if (this.currentPuzzle) {
          if (this.currentPuzzleType === PuzzleType.WireRoute) {
            const puzzle = this.currentPuzzle as ValveRoutePuzzle;
            const result = puzzle.checkAnswer();
            this.room.broadcast({
              type: 'PUZZLE_RESULT',
              correct: result.correct,
              targetValue: result.totalCount,
              submittedValue: result.correctCount,
              tolerance: 0,
            });
          } else {
            const puzzle = this.currentPuzzle as PressureMatchPuzzle;
            const result = puzzle.checkAnswer(puzzle.getCurrentPressure());
            this.room.broadcast({
              type: 'PUZZLE_RESULT',
              correct: result.correct,
              targetValue: result.targetValue,
              submittedValue: result.submittedValue,
              tolerance: result.tolerance,
            });
          }
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
