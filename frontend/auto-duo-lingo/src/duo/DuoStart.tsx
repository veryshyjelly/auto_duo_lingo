import { Box, Typography } from '@mui/material';
import { useLesson } from '../context/LessonContext';
import { start } from '../Action';
import DuoShell from './DuoShell';
import { DuoFooterButton } from './DuoFooter';
import { useThemeMode } from '../context/ThemeModeContext';
import { duo, duoColors } from './duo-theme';

export default function DuoStart() {
  const { ws, connectionState, pending, onActionSent, info } = useLesson();
  const { mode } = useThemeMode();
  const c = duoColors(mode);
  const isConnected = connectionState === 'connected';

  const handleStart = () => {
    onActionSent();
    start(ws);
  };

  return (
    <DuoShell
      showFooter
      footer={
        <DuoFooterButton
          label={pending ? 'Starting…' : 'Start'}
          onClick={handleStart}
          variant="primary"
          disabled={!isConnected || pending}
          fullWidth
        />
      }
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '50dvh',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: '3rem', mb: 1 }}>🦉</Typography>
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: duo.green }}>
          Ready for your lesson?
        </Typography>
        <Typography sx={{ color: c.textMuted, maxWidth: 400 }}>
          {isConnected
            ? 'Press Start to begin. Answers you tap here are sent to Duolingo on your computer.'
            : 'Waiting for server connection…'}
        </Typography>
        {info.progress > 0 && (
          <Typography sx={{ color: c.textMuted, fontWeight: 700 }}>
            {info.progress}% complete
          </Typography>
        )}
      </Box>
    </DuoShell>
  );
}
