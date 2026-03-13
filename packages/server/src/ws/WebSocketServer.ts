import { Server } from 'http';
import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { v4 as uuid } from 'uuid';
import { MessageRouter } from './MessageRouter.js';
import type { LeviathanPipeline } from '../voice/LeviathanPipeline.js';
import type { VoiceProfileStore } from '../voice/VoiceProfileStore.js';

export class WebSocketServer {
  private wss: WSServer;
  private router: MessageRouter;
  private connections = new Map<string, WebSocket>();

  constructor(server: Server, leviathanPipeline?: LeviathanPipeline, voiceProfileStore?: VoiceProfileStore) {
    this.router = new MessageRouter(leviathanPipeline, voiceProfileStore);
    this.wss = new WSServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      const playerId = uuid();
      this.connections.set(playerId, ws);
      console.log(`[WS] Player connected: ${playerId}`);

      // Send playerId to client immediately
      ws.send(JSON.stringify({ type: 'CONNECTED', playerId }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.router.handle(playerId, message, ws);
        } catch (e) {
          console.error('[WS] Invalid message:', e);
        }
      });

      ws.on('close', () => {
        console.log(`[WS] Player disconnected: ${playerId}`);
        this.router.handleDisconnect(playerId);
        this.connections.delete(playerId);
      });
    });

    console.log('[WS] WebSocket server initialized');
  }

  broadcast(playerIds: string[], message: object) {
    const data = JSON.stringify(message);
    for (const id of playerIds) {
      const ws = this.connections.get(id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}
