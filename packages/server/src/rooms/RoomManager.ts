import { WebSocket } from 'ws';
import { ROOM_CODE_LENGTH } from '@abyssal-echo/shared';
import { GameRoom } from './GameRoom.js';
import type { LeviathanPipeline } from '../voice/LeviathanPipeline.js';
import type { VoiceProfileStore } from '../voice/VoiceProfileStore.js';

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>();
  private leviathanPipeline?: LeviathanPipeline;
  private voiceProfileStore?: VoiceProfileStore;

  constructor(leviathanPipeline?: LeviathanPipeline, voiceProfileStore?: VoiceProfileStore) {
    this.leviathanPipeline = leviathanPipeline;
    this.voiceProfileStore = voiceProfileStore;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  createRoom(playerId: string, ws: WebSocket) {
    let code = this.generateCode();
    while (this.rooms.has(code)) {
      code = this.generateCode();
    }

    const room = new GameRoom(code, this.leviathanPipeline);
    this.rooms.set(code, room);
    room.addPlayer(playerId, ws);
    this.playerRooms.set(playerId, code);

    console.log(`[RoomManager] Room ${code} created by ${playerId}`);
  }

  joinRoom(playerId: string, roomId: string, ws: WebSocket) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
      return;
    }
    room.addPlayer(playerId, ws);
    this.playerRooms.set(playerId, roomId.toUpperCase());
  }

  playerReady(playerId: string) {
    const room = this.getPlayerRoom(playerId);
    room?.playerReady(playerId);
  }

  handlePuzzleAction(playerId: string, action: string, value: number) {
    const room = this.getPlayerRoom(playerId);
    room?.handlePuzzleAction(playerId, action, value);
  }

  calibrationComplete(playerId: string) {
    const room = this.getPlayerRoom(playerId);
    room?.calibrationComplete(playerId);
  }

  handleDisconnect(playerId: string) {
    const room = this.getPlayerRoom(playerId);
    room?.removePlayer(playerId);
    this.playerRooms.delete(playerId);
  }

  getPlayerRoomId(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  private getPlayerRoom(playerId: string): GameRoom | undefined {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }
}
