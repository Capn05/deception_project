import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager.js';

interface QueueEntry {
  playerId: string;
  ws: WebSocket;
}

export class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  enqueue(playerId: string, ws: WebSocket) {
    // Don't double-queue
    if (this.queue.some((e) => e.playerId === playerId)) {
      return;
    }

    this.queue.push({ playerId, ws });
    ws.send(JSON.stringify({ type: 'QUEUE_STATUS', searching: true }));
    console.log(`[Matchmaking] ${playerId} queued (${this.queue.length} in queue)`);

    if (this.queue.length >= 2) {
      this.matchPair();
    }
  }

  dequeue(playerId: string) {
    const idx = this.queue.findIndex((e) => e.playerId === playerId);
    if (idx !== -1) {
      const entry = this.queue[idx];
      this.queue.splice(idx, 1);
      if (entry.ws.readyState === WebSocket.OPEN) {
        entry.ws.send(JSON.stringify({ type: 'QUEUE_STATUS', searching: false }));
      }
      console.log(`[Matchmaking] ${playerId} dequeued (${this.queue.length} in queue)`);
    }
  }

  private matchPair() {
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    console.log(`[Matchmaking] Matching ${player1.playerId} with ${player2.playerId}`);

    // Player 1 creates the room, player 2 joins it
    this.roomManager.createRoom(player1.playerId, player1.ws);
    // createRoom sends ROOM_CREATED to player1; we need the room code
    // The room code is sent via ROOM_CREATED message — we need to get it from RoomManager
    const roomId = this.roomManager.getPlayerRoomId(player1.playerId);
    if (roomId) {
      this.roomManager.joinRoom(player2.playerId, roomId, player2.ws);
    }
  }
}
