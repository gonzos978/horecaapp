import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  userId?: string;
  userRole?: string;
  userName?: string;
  autoConnect?: boolean;
}

interface SocketEvent {
  event: string;
  data: unknown;
  timestamp: string;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = (options: UseSocketOptions = {}) => {
  const { userId, userRole, userName, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✓ Socket.io connected:', socket.id);
      setIsConnected(true);
      setError(null);

      if (userId && userRole && userName) {
        socket.emit('register', { userId, userRole, userName });
      }
    });

    socket.on('disconnect', () => {
      console.log('✗ Socket.io disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('registered', (data) => {
      console.log('✓ Registered for real-time updates:', data);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        console.log('✓ Socket.io disconnected (cleanup)');
      }
    };
  }, [autoConnect, userId, userRole, userName]);

  const on = (event: string, callback: (data: unknown) => void) => {
    if (!socketRef.current) {
      console.warn('Socket not initialized');
      return;
    }

    socketRef.current.on(event, (data) => {
      setLastEvent({ event, data, timestamp: new Date().toISOString() });
      callback(data);
    });
  };

  const off = (event: string) => {
    if (!socketRef.current) return;
    socketRef.current.off(event);
  };

  const emit = (event: string, data: unknown) => {
    if (!socketRef.current) {
      console.warn('Socket not initialized');
      return;
    }

    if (!isConnected) {
      console.warn('Socket not connected, queuing event:', event);
      return;
    }

    socketRef.current.emit(event, data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    lastEvent,
    error,
    on,
    off,
    emit
  };
};
