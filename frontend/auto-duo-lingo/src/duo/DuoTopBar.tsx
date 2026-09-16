import { Box, IconButton, LinearProgress, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircleIcon from '@mui/icons-material/Circle';
import { useLesson } from '../context/LessonContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { duo, duoColors } from './duo-theme';

export default function DuoTopBar() {
  const { mode, toggleMode } = useThemeMode();
  const { info, connectionState, connectedClients, reconnect, authError } = useLesson();
  const c = duoColors(mode);

  const statusColor =
    connectionState === 'connected' ? duo.green :
    connectionState === 'reconnecting' ? duo.yellow : duo.red;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderBottom: `2px solid ${c.border}`,
        bgcolor: c.bg,
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.5, minWidth: 80 }}>
        <IconButton size="small" aria-label="Close" sx={{ color: c.borderLight }}>
          <CloseIcon />
        </IconButton>
        <IconButton size="small" aria-label="Settings" sx={{ color: c.borderLight }}>
          <SettingsIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={info.progress}
          sx={{
            height: 14,
            borderRadius: 7,
            bgcolor: c.progressTrack,
            '& .MuiLinearProgress-bar': {
              borderRadius: 7,
              bgcolor: info.progress === 100 ? duo.green : duo.green,
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 80, justifyContent: 'flex-end' }}>
        <Tooltip title={authError ? 'Auth failed' : `${connectedClients} device(s) · ${connectionState}`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
            <CircleIcon sx={{ fontSize: 10, color: statusColor }} />
            <Box
              component="span"
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: duo.blue,
                lineHeight: 1,
              }}
            >
              ∞
            </Box>
          </Box>
        </Tooltip>
        <Tooltip title="Refresh connection">
          <IconButton size="small" onClick={reconnect} aria-label="Refresh" sx={{ color: c.borderLight }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton size="small" onClick={toggleMode} aria-label="Toggle theme" sx={{ color: c.borderLight }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
