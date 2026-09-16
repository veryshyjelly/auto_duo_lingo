import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { useThemeMode } from '../context/ThemeModeContext';
import { duoColors } from './duo-theme';

export default function DuoFooter({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 4 },
        py: 2,
        pb: 'calc(16px + var(--safe-bottom))',
        borderTop: `2px solid ${c.border}`,
        bgcolor: c.bg,
        zIndex: 100,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1140, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        {children}
      </Box>
    </Box>
  );
}

export function DuoFooterButton({
  label, onClick, disabled, variant = 'outline', fullWidth,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'primary' | 'warning';
  fullWidth?: boolean;
}) {
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  const isPrimary = variant === 'primary' || variant === 'warning';
  const enabled = isPrimary && !disabled;

  return (
    <Box
      component="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      sx={{
        flex: fullWidth ? 1 : '0 0 auto',
        minWidth: { xs: 120, md: 150 },
        maxWidth: fullWidth ? 'none' : 200,
        py: 1.5,
        px: 3,
        fontSize: '0.95rem',
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
        borderRadius: '12px',
        border: variant === 'outline' ? `2px solid ${c.border}` : 'none',
        bgcolor: enabled
          ? (variant === 'warning' ? '#FFC800' : '#58CC02')
          : isPrimary ? c.footerDisabled : 'transparent',
        color: enabled ? '#FFFFFF' : variant === 'outline' ? c.border : c.footerDisabledText,
        boxShadow: enabled ? '0 4px 0 #58A700' : 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.1s',
        '&:active': enabled ? { transform: 'translateY(2px)', boxShadow: '0 2px 0 #58A700' } : {},
      }}
    >
      {label}
    </Box>
  );
}
