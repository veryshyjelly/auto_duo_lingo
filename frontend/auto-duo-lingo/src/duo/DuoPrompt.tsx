import { Box, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useThemeMode } from '../context/ThemeModeContext';
import { duo, duoColors } from './duo-theme';

type DuoPromptProps = {
  text: string;
  badge?: string;
};

export default function DuoPrompt({ text, badge }: DuoPromptProps) {
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  return (
    <Box sx={{ width: '100%', mb: { xs: 3, md: 4 }, textAlign: 'left' }}>
      {badge && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: duo.purple,
            color: '#FFFFFF',
            px: 1.5,
            py: 0.5,
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            mb: 2,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 14 }} />
          {badge}
        </Box>
      )}
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: '1.5rem', md: '1.75rem' },
          fontWeight: 700,
          lineHeight: 1.35,
          color: c.text,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export function displayPrompt(info: { prompt?: string; title?: string }): string {
  if (info.prompt && info.prompt !== info.title) return info.prompt;
  return info.prompt || info.title || '';
}
