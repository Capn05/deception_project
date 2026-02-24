import { ClientMessage, ServerMessage } from '@abyssal-echo/shared';

type MessageHandler = (message: ServerMessage) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private url: string | null = null;
  private connected = false;

  connect(url?: string) {
    this.url = url || `ws://${window.location.hostname}:3001`;

    // Don't create duplicate connections
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.maxReconnectAttempts = 5;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[Socket] Connected');
      this.connected = true;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handlers.forEach((handler) => handler(message));
      } catch (e) {
        console.error('[Socket] Parse error:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[Socket] Disconnected');
      this.connected = false;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[Socket] Error:', error);
    };
  }

  private attemptReconnect() {
    if (!this.url || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Socket] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(this.url!), delay);
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Socket] Cannot send, not connected:', message.type);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    this.maxReconnectAttempts = 0;
    this.ws?.close();
  }
}

export const socketService = new SocketService();
