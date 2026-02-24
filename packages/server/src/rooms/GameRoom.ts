import { WebSocket } from 'ws';
import { PlayerRole, GamePhase, MAX_PLAYERS_PER_ROOM, ServerMessage } from '@abyssal-echo/shared';
import { GameStateMachine } from '../game/GameStateMachine.js';
import type { LeviathanPipeline } from '../voice/LeviathanPipeline.js';

interface ConnectedPlayer {
  id: string;
  ws: WebSocket;
  role: PlayerRole;
  ready: boolean;
  calibrated: boolean;
}

export class GameRoom {
  readonly roomId: string;
  private players: ConnectedPlayer[] = [];
  private stateMachine: GameStateMachine;
  private leviathanPipeline?: LeviathanPipeline;

  constructor(roomId: string, leviathanPipeline?: LeviathanPipeline) {
    this.roomId = roomId;
    this.stateMachine = new GameStateMachine(this);
    this.leviathanPipeline = leviathanPipeline;
  }

  addPlayer(playerId: string, ws: WebSocket) {
    if (this.players.length >= MAX_PLAYERS_PER_ROOM) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' }));
      return;
    }

    const role = this.players.length === 0 ? PlayerRole.Observer : PlayerRole.Operator;
    this.players.push({ id: playerId, ws, role, ready: false, calibrated: false });

    this.send(playerId, { type: 'ROOM_JOINED', roomId: this.roomId, role });

    if (this.players.length === 2) {
      this.broadcast({ type: 'PARTNER_CONNECTED' });
    }
  }

  removePlayer(playerId: string) {
    this.players = this.players.filter((p) => p.id !== playerId);
    this.broadcast({ type: 'PARTNER_DISCONNECTED' });

    // Stop monitoring if a player disconnects
    if (this.leviathanPipeline) {
      this.leviathanPipeline.stopMonitoring(this.roomId).catch((err) => {
        console.error(`[GameRoom] Failed to stop monitoring on disconnect:`, err);
      });
    }
  }

  playerReady(playerId: string) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      player.ready = true;
      if (this.players.length === 2 && this.players.every((p) => p.ready)) {
        this.stateMachine.transition(GamePhase.Calibration);
      }
    }
  }

  calibrationComplete(playerId: string) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      player.calibrated = true;
      if (this.players.every((p) => p.calibrated)) {
        this.stateMachine.transition(GamePhase.Playing);
      }
    }
  }

  handlePuzzleAction(playerId: string, action: string, value: number) {
    this.stateMachine.handlePuzzleAction(playerId, action, value);
  }

  /** Called by GameStateMachine when entering Playing phase */
  onPlayingPhase(): void {
    if (!this.leviathanPipeline) return;

    // Wire up interception notifications — only to the muted player
    this.leviathanPipeline.setOnIntercept((roomId, targetPlayerId, active) => {
      this.send(targetPlayerId, { type: 'LEVIATHAN_INTERCEPT', targetPlayerId, active });
    });

    const playerIds = this.getAllPlayerIds();
    this.leviathanPipeline.startMonitoring(
      this.roomId,
      playerIds,
      () => this.getPuzzleContext(),
    ).catch((err) => {
      console.error(`[GameRoom] Failed to start Leviathan monitoring:`, err);
    });
  }

  /** Called by GameStateMachine on round end */
  onRoundEnd(): void {
    this.leviathanPipeline?.resetRound(this.roomId);
  }

  /** Called by GameStateMachine on game over */
  onGameOver(): void {
    this.leviathanPipeline?.stopMonitoring(this.roomId).catch((err) => {
      console.error(`[GameRoom] Failed to stop Leviathan monitoring:`, err);
    });
  }

  getPuzzleContext(): { puzzleType: string; targetValue?: number; currentRound: number; maxRounds: number } | null {
    return this.stateMachine.getPuzzleContext();
  }

  getPlayersByRole(role: PlayerRole): ConnectedPlayer[] {
    return this.players.filter((p) => p.role === role);
  }

  getPlayerRole(playerId: string): PlayerRole | undefined {
    return this.players.find((p) => p.id === playerId)?.role;
  }

  send(playerId: string, message: ServerMessage) {
    const player = this.players.find((p) => p.id === playerId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    for (const player of this.players) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    }
  }

  broadcastToRole(role: PlayerRole, message: ServerMessage) {
    for (const player of this.players) {
      if (player.role === role && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    }
  }

  getAllPlayerIds(): string[] {
    return this.players.map((p) => p.id);
  }
}
