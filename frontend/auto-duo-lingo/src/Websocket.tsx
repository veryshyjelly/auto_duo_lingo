import { Chip, Container, IconButton } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import AdjustIcon from '@mui/icons-material/Adjust';
import { proceed } from "./Action";

interface WebSocketComponentProps {
    ws: React.MutableRefObject<WebSocket | null>
    setInfo: (info: string) => void
}

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

function getWebSocketURL(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${protocol}//${window.location.host}/connect${tokenQuery}`;
}

export const WebSocketComponent: React.FC<WebSocketComponentProps> = ({ ws, setInfo }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef<number | null>(null);
    const shouldReconnect = useRef(true);

    const clearReconnectTimer = () => {
        if (reconnectTimer.current !== null) {
            window.clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
    };

    const scheduleReconnect = () => {
        if (!shouldReconnect.current) return;
        setConnectionState('reconnecting');
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
        reconnectAttempt.current += 1;
        clearReconnectTimer();
        reconnectTimer.current = window.setTimeout(() => {
            connectWebSocket();
        }, delay);
    };

    const connectWebSocket = () => {
        if (ws.current) {
            ws.current.onclose = null;
            ws.current.close();
        }

        ws.current = new WebSocket(getWebSocketURL());

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            reconnectAttempt.current = 0;
            setConnectionState('connected');
        };

        ws.current.onmessage = (event: MessageEvent) => {
            setInfo(event.data);
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            setConnectionState('disconnected');
            scheduleReconnect();
        };

        ws.current.onerror = (error: Event) => {
            console.error("WebSocket error:", error);
        };
    };

    const reconnectWebSocket = () => {
        console.log("Reconnecting WebSocket...");
        reconnectAttempt.current = 0;
        clearReconnectTimer();
        connectWebSocket();
    };

    useEffect(() => {
        shouldReconnect.current = true;
        connectWebSocket();

        return () => {
            shouldReconnect.current = false;
            clearReconnectTimer();
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const chipLabel = connectionState === 'connected'
        ? 'Connected'
        : connectionState === 'reconnecting'
            ? 'Reconnecting…'
            : 'Disconnected';

    const chipColor = connectionState === 'connected' ? 'success' : 'error';

    return (
        <Container fixed className='flex justify-between'>
            <IconButton onClick={reconnectWebSocket} aria-label='refresh'>
                <RefreshIcon />
            </IconButton>
            <Chip label={chipLabel}
                color={chipColor}
                sx={{ fontSize: "1rem" }}
                variant='outlined'
                className='my-4'
            />
            <IconButton onClick={() => proceed(ws)}>
                <AdjustIcon />
            </IconButton>
        </Container>
    );
};

export default WebSocketComponent;
