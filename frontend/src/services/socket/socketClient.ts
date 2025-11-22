import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@logistics/shared';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      path: '/ws', // Match backend configuration
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(orderId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('subscribe', orderId);
  }

  unsubscribe(orderId: string) {
    this.socket?.emit('unsubscribe', orderId);
  }

  onTrackUpdate(callback: (payload: any) => void) {
    this.socket?.on('track:update', callback);
  }

  onStatusUpdate(callback: (payload: any) => void) {
    this.socket?.on('status:update', callback);
  }

  offTrackUpdate(callback: (payload: any) => void) {
    this.socket?.off('track:update', callback);
  }

  offStatusUpdate(callback: (payload: any) => void) {
    this.socket?.off('status:update', callback);
  }
}

export const socketClient = new SocketClient();
