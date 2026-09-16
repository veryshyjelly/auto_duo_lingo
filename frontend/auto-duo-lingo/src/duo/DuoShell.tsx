import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { useThemeMode } from '../context/ThemeModeContext';
import { duoColors } from './duo-theme';
import DuoTopBar from './DuoTopBar';
import DuoFooter from './DuoFooter';

type DuoShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  showFooter?: boolean;
};

export default function DuoShell({ children, footer, showFooter }: DuoShellProps) {
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: c.bg,
        color: c.text,
        display: 'flex',
        flexDirection: 'column',
        pt: 'var(--safe-top)',
      }}
    >
      <DuoTopBar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, md: 4 },
          pt: { xs: 2, md: 4 },
          pb: showFooter ? { xs: 'calc(80px + var(--safe-bottom))', md: 3 } : 3,
          overflowY: 'auto',
          width: '100%',
          maxWidth: 1140,
          mx: 'auto',
        }}
      >
        {children}
      </Box>
      {showFooter && footer && (
        <DuoFooter>{footer}</DuoFooter>
      )}
    </Box>
  );
}
