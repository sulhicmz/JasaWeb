import { useState, useEffect, useRef, useCallback } from 'react';
import type { WSMessage } from '@/services/shared/WebSocketService';

export interface UseWebSocketOptions {
  token?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: WSMessage | null;
  connectionId: string | null;
}

export interface UseWebSocketReturn extends WebSocketState {
  send: (message: Partial<WSMessage>) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    token,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    connectionId: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (state.connected || state.connecting) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const baseUrl = window.location.origin;
      const wsUrl = `${baseUrl}/api/ws`;
      
      const eventSource = new EventSource(wsUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null
        }));
        reconnectAttemptsRef.current = 0;
        
        startHeartbeat();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          setState(prev => ({ ...prev, lastMessage: message }));

          if (message.type === 'connection_status') {
            setState(prev => ({
              ...prev,
              connectionId: message.payload.connectionId
            }));
          }

          if (message.type === 'heartbeat') {
            return;
          }

          onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'Connection error'
        }));

        stopHeartbeat();

        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          scheduleReconnect();
        } else {
          eventSource.close();
        }
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
    }
  }, [state.connected, state.connecting, autoReconnect, maxReconnectAttempts]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    stopHeartbeat();
    clearReconnectTimeout();

    setState({
      connected: false,
      connecting: false,
      error: null,
      lastMessage: null,
      connectionId: null
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(async (message: Partial<WSMessage>) => {
    if (!state.connected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      const fullMessage: WSMessage = {
        type: message.type || 'admin_broadcast',
        payload: message.payload || {},
        timestamp: Date.now(),
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId: message.userId,
        roomId: message.roomId
      };

      await fetch('/api/ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullMessage)
      });
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  }, [state.connected]);

  const joinRoom = useCallback((roomId: string) => {
    send({
      type: 'system_alert',
      payload: { action: 'join_room', roomId },
      roomId
    });
  }, [send]);

  const leaveRoom = useCallback((roomId: string) => {
    send({
      type: 'system_alert',
      payload: { action: 'leave_room', roomId },
      roomId
    });
  }, [send]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    
    heartbeatTimeoutRef.current = setInterval(() => {
      send({
        type: 'heartbeat',
        payload: { timestamp: Date.now() }
      });
    }, heartbeatInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout();
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'system_alert':
        if (message.payload.notification) {
          handleNotification(message.payload.notification);
        }
        break;
      case 'project_update':
        handleProjectUpdate(message.payload);
        break;
      case 'payment_received':
        handlePaymentReceived(message.payload);
        break;
      case 'admin_broadcast':
        handleAdminBroadcast(message.payload);
        break;
      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNotification = useCallback((notification: any) => {
    if (notification.priority === 'critical' || notification.priority === 'high') {
      alert(`${notification.title}: ${notification.message}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProjectUpdate = useCallback((payload: any) => {
    console.log('Project update received:', payload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaymentReceived = useCallback((payload: any) => {
    console.log('Payment received:', payload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdminBroadcast = useCallback((payload: any) => {
    console.log('Admin broadcast:', payload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    send,
    joinRoom,
    leaveRoom,
    disconnect,
    reconnect
  };
}

export function useWebSocketRoom(roomId: string, options?: UseWebSocketOptions) {
  const ws = useWebSocket(options);

  useEffect(() => {
    if (ws.connected && roomId) {
      ws.joinRoom(roomId);
    }

    return () => {
      if (ws.connected && roomId) {
        ws.leaveRoom(roomId);
      }
    };
  }, [ws.connected, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return ws;
}

export function useAdminWebSocket(options?: UseWebSocketOptions) {
  return useWebSocket({
    ...options,
    autoReconnect: true,
    maxReconnectAttempts: 10
  });
}