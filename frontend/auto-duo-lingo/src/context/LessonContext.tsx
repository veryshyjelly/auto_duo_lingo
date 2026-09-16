import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Info, ChallengeType, WS } from '../Types';

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

type LessonContextValue = {
  info: Info;
  ws: WS;
  connectionState: ConnectionState;
  connectedClients: number;
  lanUrl: string;
  pending: boolean;
  authError: boolean;
  reconnect: () => void;
  onActionSent: () => void;
};

const defaultInfo: Info = { progress: 0, type: ChallengeType.Nothing };

const LessonContext = createContext<LessonContextValue | null>(null);

function getWebSocketURL(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${protocol}//${window.location.host}/connect${tokenQuery}`;
}

export function LessonProvider({ children }: { children: React.ReactNode }) {
  const ws = useRef<WebSocket | null>(null);
  const infoRef = useRef('');
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<number | null>(null);
  const shouldReconnect = useRef(true);
  const connectRef = useRef<() => void>(() => {});

  const [info, setInfo] = useState<Info>(defaultInfo);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectedClients, setConnectedClients] = useState(0);
  const [lanUrl, setLanUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [authError, setAuthError] = useState(false);

  const clearReconnectTimer = () => {
    if (reconnectTimer.current !== null) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const setIt = useCallback((val: string) => {
    setPending(false);
    if (infoRef.current !== val) {
      infoRef.current = val;
      setInfo(JSON.parse(val));
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnect.current) return;
    setConnectionState('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
    reconnectAttempt.current += 1;
    clearReconnectTimer();
    reconnectTimer.current = window.setTimeout(() => connectRef.current(), delay);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
    }

    const socket = new WebSocket(getWebSocketURL());
    ws.current = socket;

    socket.onopen = () => {
      reconnectAttempt.current = 0;
      setConnectionState('connected');
      setAuthError(false);
    };

    socket.onmessage = (event: MessageEvent) => setIt(event.data);

    socket.onclose = (event: CloseEvent) => {
      setConnectionState('disconnected');
      if (event.code === 1008 || event.code === 4001) {
        setAuthError(true);
        shouldReconnect.current = false;
        return;
      }
      scheduleReconnect();
    };

    socket.onerror = () => setConnectionState('disconnected');
  }, [scheduleReconnect, setIt]);

  connectRef.current = connectWebSocket;

  const reconnect = useCallback(() => {
    reconnectAttempt.current = 0;
    clearReconnectTimer();
    shouldReconnect.current = true;
    setAuthError(false);
    connectWebSocket();
  }, [connectWebSocket]);

  const onActionSent = useCallback(() => {
    setPending(true);
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  useEffect(() => {
    shouldReconnect.current = true;
    connectWebSocket();

    const fetchStatus = () => {
      fetch('/status')
        .then(res => res.json())
        .then(data => {
          setLanUrl(data.lanUrl || window.location.origin);
          setConnectedClients(data.connectedClients ?? 0);
        })
        .catch(() => setLanUrl(window.location.origin));
    };

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 5000);

    return () => {
      shouldReconnect.current = false;
      clearReconnectTimer();
      window.clearInterval(interval);
      if (ws.current) ws.current.close();
    };
  }, [connectWebSocket]);

  return (
    <LessonContext.Provider value={{
      info, ws, connectionState, connectedClients, lanUrl,
      pending, authError, reconnect, onActionSent,
    }}>
      {children}
    </LessonContext.Provider>
  );
}

export function useLesson() {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLesson must be used within LessonProvider');
  return ctx;
}
