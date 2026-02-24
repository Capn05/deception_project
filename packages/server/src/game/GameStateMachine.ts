import { GamePhase, MAX_ROUNDS } from '@abyssal-echo/shared';
import { GameRoom } from '../rooms/GameRoom.js';
import { PuzzleOrchestrator } from './PuzzleOrchestrator.js';

export class GameStateMachine {
  private phase: GamePhase = GamePhase.Lobby;
  private currentRound = 0;
  private puzzleOrchestrator: PuzzleOrchestrator;

  constructor(private room: GameRoom) {
    this.puzzleOrchestrator = new PuzzleOrchestrator(room);
  }

  transition(newPhase: GamePhase) {
    console.log(`[GSM] ${this.room.roomId}: ${this.phase} → ${newPhase}`);
    this.phase = newPhase;
    this.room.broadcast({ type: 'PHASE_CHANGE', phase: newPhase });

    switch (newPhase) {
      case GamePhase.Playing:
        this.currentRound++;
        this.puzzleOrchestrator.startPuzzle();
        this.room.onPlayingPhase();
        break;
      case GamePhase.RoundEnd:
        this.room.onRoundEnd();
        if (this.currentRound >= MAX_ROUNDS) {
          setTimeout(() => this.transition(GamePhase.GameOver), 3000);
        } else {
          setTimeout(() => this.transition(GamePhase.Playing), 3000);
        }
        break;
      case GamePhase.GameOver:
        this.room.onGameOver();
        break;
    }
  }

  handlePuzzleAction(playerId: string, action: string, value: number) {
    if (this.phase !== GamePhase.Playing) return;
    const result = this.puzzleOrchestrator.handleAction(playerId, action, value);
    if (result) {
      this.transition(GamePhase.RoundEnd);
    }
  }

  getPuzzleContext(): { puzzleType: string; targetValue?: number; currentRound: number; maxRounds: number } | null {
    const puzzleInfo = this.puzzleOrchestrator.getCurrentPuzzleInfo();
    if (!puzzleInfo) return null;
    return {
      ...puzzleInfo,
      currentRound: this.currentRound,
      maxRounds: MAX_ROUNDS,
    };
  }

  getPhase(): GamePhase {
    return this.phase;
  }
}
