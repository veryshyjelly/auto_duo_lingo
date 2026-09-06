import { IconButton, Tooltip } from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useEffect, useRef } from "react";
import { playAudio } from "./Action";
import { Info, WS } from "./Types";

function proxyAudioUrl(url: string): string {
    return `/audio?url=${encodeURIComponent(url)}`;
}

const AudioPlayer = ({ info, ws }: { info: Info; ws: WS }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastUrl = useRef<string>("");

    const primaryUrl = info.audioUrls?.[0];

    useEffect(() => {
        if (!primaryUrl || primaryUrl === lastUrl.current) return;
        lastUrl.current = primaryUrl;

        const audio = new Audio(proxyAudioUrl(primaryUrl));
        audioRef.current = audio;
        audio.play().catch(() => {
            // Autoplay may be blocked; user can tap the button.
        });

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [primaryUrl]);

    const replay = () => {
        if (primaryUrl) {
            const audio = audioRef.current ?? new Audio(proxyAudioUrl(primaryUrl));
            audioRef.current = audio;
            audio.currentTime = 0;
            audio.play().catch(console.error);
            return;
        }
        playAudio(ws);
    };

    if (!info.hasAudio && !primaryUrl) return null;

    const label = primaryUrl
        ? "Play sentence audio"
        : "Play audio on lesson browser";

    return (
        <Tooltip title={label}>
            <IconButton onClick={replay} aria-label={label} size="large" color="primary">
                <VolumeUpIcon fontSize="large" />
            </IconButton>
        </Tooltip>
    );
};

export default AudioPlayer;
