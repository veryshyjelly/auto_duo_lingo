import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useEffect, useRef, useState } from 'react';
import { playAudio } from '../Action';
import { Info, WS } from '../Types';
import { duo } from './duo-theme';

function proxyAudioUrl(url: string): string {
  return `/audio?url=${encodeURIComponent(url)}`;
}

export default function DuoAudio({ info, ws }: { info: Info; ws: WS }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrl = useRef('');
  const [needsTap, setNeedsTap] = useState(false);
  const [playing, setPlaying] = useState(false);

  const primaryUrl = info.audioUrls?.[0];
  const isListenTap = info.title?.includes('Type what you hear');

  const play = (url: string) => {
    const audio = audioRef.current ?? new Audio(proxyAudioUrl(url));
    audioRef.current = audio;
    audio.currentTime = 0;
    setPlaying(true);
    audio.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
    audio.onended = () => setPlaying(false);
  };

  useEffect(() => {
    if (!primaryUrl || primaryUrl === lastUrl.current) return;
    lastUrl.current = primaryUrl;
    const audio = new Audio(proxyAudioUrl(primaryUrl));
    audioRef.current = audio;
    setPlaying(true);
    audio.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
    audio.onended = () => setPlaying(false);
    return () => {
      audio.pause();
      audioRef.current = null;
      setPlaying(false);
    };
  }, [primaryUrl]);

  const replay = () => {
    if (primaryUrl) {
      play(primaryUrl);
      return;
    }
    playAudio(ws);
  };

  if (!info.hasAudio && !primaryUrl) return null;

  const label = primaryUrl ? 'Play audio' : 'Play audio on lesson browser';

  if (isListenTap) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4, width: '100%' }}>
        <Tooltip title={label}>
          <IconButton
            onClick={replay}
            aria-label={label}
            className={needsTap ? 'animate-pulse-ring' : ''}
            sx={{
              width: 80,
              height: 80,
              bgcolor: duo.blue,
              color: '#fff',
              borderRadius: '20px',
              boxShadow: playing ? '0 0 0 4px rgba(28,176,246,0.3)' : 'none',
              '&:hover': { bgcolor: '#1899D6' },
            }}
          >
            <VolumeUpIcon sx={{ fontSize: 40 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Play slower (lesson browser)">
          <IconButton
            onClick={() => playAudio(ws)}
            aria-label="Play slower"
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'transparent',
              color: duo.blue,
              border: `2px solid ${duo.blue}`,
              borderRadius: '20px',
              '&:hover': { bgcolor: 'rgba(28,176,246,0.1)' },
            }}
          >
            <VolumeUpIcon sx={{ fontSize: 36 }} />
          </IconButton>
        </Tooltip>
        {needsTap && (
          <Typography
            variant="caption"
            color="primary"
            fontWeight={700}
            sx={{ position: 'absolute', mt: 11 }}
          >
            Tap to listen
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, width: '100%' }}>
      <Tooltip title={label}>
        <IconButton
          onClick={replay}
          aria-label={label}
          sx={{
            bgcolor: 'rgba(88, 204, 2, 0.1)',
            border: `2px solid ${duo.green}`,
            width: 48,
            height: 48,
          }}
        >
          <VolumeUpIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
