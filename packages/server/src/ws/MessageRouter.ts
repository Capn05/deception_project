import { WebSocket } from 'ws';
import { ClientMessage } from '@abyssal-echo/shared';
import { RoomManager } from '../rooms/RoomManager.js';
import { MatchmakingQueue } from '../rooms/MatchmakingQueue.js';
import type { LeviathanPipeline } from '../voice/LeviathanPipeline.js';
import type { VoiceProfileStore } from '../voice/VoiceProfileStore.js';

export class MessageRouter {
  private roomManager: RoomManager;
  private matchmakingQueue: MatchmakingQueue;

  constructor(leviathanPipeline?: LeviathanPipeline, voiceProfileStore?: VoiceProfileStore) {
    this.roomManager = new RoomManager(leviathanPipeline, voiceProfileStore);
    this.matchmakingQueue = new MatchmakingQueue(this.roomManager);
  }

  handle(playerId: string, message: ClientMessage, ws: WebSocket) {
    console.log(`[Router] ${playerId} -> ${message.type}`);

    switch (message.type) {
      case 'CREATE_ROOM':
        this.roomManager.createRoom(playerId, ws);
        break;
      case 'JOIN_ROOM':
        this.roomManager.joinRoom(playerId, message.roomId, ws);
        break;
      case 'READY':
        this.roomManager.playerReady(playerId);
        break;
      case 'PUZZLE_ACTION':
        this.roomManager.handlePuzzleAction(playerId, message.action, message.value);
        break;
      case 'CALIBRATION_COMPLETE':
        this.roomManager.calibrationComplete(playerId);
        break;
      case 'FIND_GAME':
        this.matchmakingQueue.enqueue(playerId, ws);
        break;
      case 'CANCEL_FIND_GAME':
        this.matchmakingQueue.dequeue(playerId);
        break;
      case 'LEAVE_GAME':
        this.handleDisconnect(playerId);
        break;
      default:
        console.warn(`[Router] Unknown message type`);
    }
  }

  handleDisconnect(playerId: string) {
    this.matchmakingQueue.dequeue(playerId);
    this.roomManager.handleDisconnect(playerId);
  }
}
