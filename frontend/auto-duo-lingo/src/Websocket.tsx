import { Chip, Container, IconButton } from "@mui/material";
import React, { useEffect, useState } from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import AdjustIcon from '@mui/icons-material/Adjust';
import { proceed } from "./Action";

interface WebSocketComponentProps {
    addr: string;
    ws: React.MutableRefObject<WebSocket | null>
    setInfo: (info: string) => void
}

export const WebSocketComponent: React.FC<WebSocketComponentProps> = ({ addr, ws, setInfo }) => {
    const [isConnected, setIsConnected] = useState(false);

    // Function to create and set up the WebSocket connection
    const connectWebSocket = () => {
        // Close existing WebSocket if it exists
        if (ws.current) {
            ws.current.onclose = null;
            ws.current.close();
        }

        // Create a new WebSocket instance
        ws.current = new WebSocket(`ws://${addr}:8080/connect`);

        // Set up WebSocket event listeners
        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        ws.current.onmessage = (event: MessageEvent) => {
            setInfo(event.data);
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
        };

        ws.current.onerror = (error: Event) => {
            console.error("WebSocket error:", error);
        };
    };

    // Reconnect WebSocket on demand
    const reconnectWebSocket = () => {
        console.log("Reconnecting WebSocket...");
        connectWebSocket();
    };

    // Effect to connect WebSocket when the component mounts
    useEffect(() => {
        connectWebSocket();

        // Cleanup on unmount
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [addr]); // Reconnect when `addr` changes

    return (
        <Container fixed className='flex justify-between'>
            <IconButton onClick={reconnectWebSocket} aria-label='refresh'>
                <RefreshIcon />
            </IconButton>
            <Chip label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
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
