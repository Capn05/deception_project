import { PlayerRole, PuzzleType, PUZZLE_TIME_LIMIT } from '@abyssal-echo/shared';
import { GameRoom } from '../rooms/GameRoom.js';
import { PressureMatchPuzzle } from './puzzles/PressureMatchPuzzle.js';
import { ValveRoutePuzzle } from './puzzles/ValveRoutePuzzle.js';
import { MazeNavigationPuzzle, Direction } from './puzzles/MazeNavigationPuzzle.js';
import { SimonSaysPuzzle } from './puzzles/SimonSaysPuzzle.js';
import { WireSequencePuzzle } from './puzzles/WireSequencePuzzle.js';

type AnyPuzzle = PressureMatchPuzzle | ValveRoutePuzzle | MazeNavigationPuzzle | SimonSaysPuzzle | WireSequencePuzzle;

export class PuzzleOrchestrator {
  private currentPuzzle: AnyPuzzle | null = null;
  private currentPuzzleType: PuzzleType | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeRemaining = PUZZLE_TIME_LIMIT;

  constructor(private room: GameRoom) {}

  startPuzzle() {
    // Random puzzle selection (25% each)
    const roll = Math.random();
    if (roll < 0.25) {
      this.currentPuzzle = new ValveRoutePuzzle();
      this.currentPuzzleType = PuzzleType.WireRoute;
    } else if (roll < 0.5) {
      this.currentPuzzle = new MazeNavigationPuzzle();
      this.currentPuzzleType = PuzzleType.MazeNavigation;
    } else if (roll < 0.75) {
      this.currentPuzzle = new SimonSaysPuzzle();
      this.currentPuzzleType = PuzzleType.SequenceInput;
    } else {
      this.currentPuzzle = new WireSequencePuzzle();
      this.currentPuzzleType = PuzzleType.WireSequence;
    }

    this.timeRemaining = PUZZLE_TIME_LIMIT;

    const observerState = this.currentPuzzle.getStateForRole(PlayerRole.Observer) as Record<string, unknown>;
    const operatorState = this.currentPuzzle.getStateForRole(PlayerRole.Operator) as Record<string, unknown>;

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

    if (this.currentPuzzleType === PuzzleType.MazeNavigation) {
      const puzzle = this.currentPuzzle as MazeNavigationPuzzle;

      if (action === 'MOVE') {
        const result = puzzle.move(value as Direction);

        // Broadcast updated position to both roles
        this.room.broadcastToRole(PlayerRole.Observer, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.MazeNavigation,
          state: puzzle.getStateForRole(PlayerRole.Observer) as Record<string, unknown>,
        });
        const operatorState = puzzle.getStateForRole(PlayerRole.Operator) as Record<string, unknown>;
        operatorState.moveResult = { hitWall: result.hitWall, success: result.success };
        this.room.broadcastToRole(PlayerRole.Operator, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.MazeNavigation,
          state: operatorState,
        });

        if (puzzle.isComplete()) {
          this.stopTimer();
          const mazeResult = puzzle.getResult();
          this.room.broadcast({
            type: 'PUZZLE_RESULT',
            correct: mazeResult.correct,
            targetValue: mazeResult.maxStrikes,
            submittedValue: mazeResult.strikes,
            tolerance: -1,
          });
          return true;
        }
        return false;
      }
      return false;
    }

    if (this.currentPuzzleType === PuzzleType.SequenceInput) {
      const puzzle = this.currentPuzzle as SimonSaysPuzzle;

      if (action === 'PRESS') {
        puzzle.pressButton(value);

        // Broadcast updated state to both roles
        this.room.broadcastToRole(PlayerRole.Observer, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.SequenceInput,
          state: puzzle.getStateForRole(PlayerRole.Observer) as Record<string, unknown>,
        });
        this.room.broadcastToRole(PlayerRole.Operator, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.SequenceInput,
          state: puzzle.getStateForRole(PlayerRole.Operator) as Record<string, unknown>,
        });

        if (puzzle.isComplete()) {
          this.stopTimer();
          const simonResult = puzzle.getResult();
          this.room.broadcast({
            type: 'PUZZLE_RESULT',
            correct: simonResult.correct,
            targetValue: simonResult.totalStages,
            submittedValue: simonResult.stages,
            tolerance: -2,
          });
          return true;
        }
        return false;
      }
      return false;
    }

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

    if (this.currentPuzzleType === PuzzleType.WireSequence) {
      const puzzle = this.currentPuzzle as WireSequencePuzzle;

      if (action === 'DECIDE') {
        puzzle.decide(value === 1);

        // Broadcast updated state to both roles
        this.room.broadcastToRole(PlayerRole.Observer, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.WireSequence,
          state: puzzle.getStateForRole(PlayerRole.Observer) as Record<string, unknown>,
        });
        this.room.broadcastToRole(PlayerRole.Operator, {
          type: 'PUZZLE_STATE',
          puzzleType: PuzzleType.WireSequence,
          state: puzzle.getStateForRole(PlayerRole.Operator) as Record<string, unknown>,
        });

        if (puzzle.isComplete()) {
          this.stopTimer();
          const wireResult = puzzle.getResult();
          this.room.broadcast({
            type: 'PUZZLE_RESULT',
            correct: wireResult.correct,
            targetValue: wireResult.totalWires,
            submittedValue: wireResult.wiresProcessed,
            tolerance: -3,
          });
          return true;
        }
        return false;
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

    if (this.currentPuzzleType === PuzzleType.MazeNavigation) {
      return { puzzleType: PuzzleType.MazeNavigation };
    }

    if (this.currentPuzzleType === PuzzleType.SequenceInput) {
      return { puzzleType: PuzzleType.SequenceInput };
    }

    if (this.currentPuzzleType === PuzzleType.WireSequence) {
      return { puzzleType: PuzzleType.WireSequence };
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
          if (this.currentPuzzleType === PuzzleType.SequenceInput) {
            const puzzle = this.currentPuzzle as SimonSaysPuzzle;
            const simonResult = puzzle.getResult();
            this.room.broadcast({
              type: 'PUZZLE_RESULT',
              correct: simonResult.correct,
              targetValue: simonResult.totalStages,
              submittedValue: simonResult.stages,
              tolerance: -2,
            });
          } else if (this.currentPuzzleType === PuzzleType.MazeNavigation) {
            const puzzle = this.currentPuzzle as MazeNavigationPuzzle;
            const mazeResult = puzzle.getResult();
            this.room.broadcast({
              type: 'PUZZLE_RESULT',
              correct: mazeResult.correct,
              targetValue: mazeResult.maxStrikes,
              submittedValue: mazeResult.strikes,
              tolerance: -1,
            });
          } else if (this.currentPuzzleType === PuzzleType.WireSequence) {
            const puzzle = this.currentPuzzle as WireSequencePuzzle;
            const wireResult = puzzle.getResult();
            this.room.broadcast({
              type: 'PUZZLE_RESULT',
              correct: wireResult.correct,
              targetValue: wireResult.totalWires,
              submittedValue: wireResult.wiresProcessed,
              tolerance: -3,
            });
          } else if (this.currentPuzzleType === PuzzleType.WireRoute) {
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
