import { Box, Typography } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import { duoColors } from './duo-theme';

type DuoChoiceCardProps = {
  label: string;
  imageUrl?: string;
  index: number;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function DuoChoiceCard({
  label, imageUrl, index, selected, disabled, onClick,
}: DuoChoiceCardProps) {
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  return (
    <Box
      component="button"
      onClick={disabled ? undefined : onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 200,
        minHeight: imageUrl ? 220 : 120,
        p: 0,
        border: `2px solid ${selected ? '#1CB0F6' : c.border}`,
        borderBottomWidth: selected ? 4 : 2,
        borderRadius: '16px',
        bgcolor: c.card,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !selected ? 0.5 : 1,
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, border-width 0.15s',
        overflow: 'hidden',
        '&:hover': disabled ? {} : { borderColor: selected ? '#1CB0F6' : c.borderLight },
      }}
    >
      {imageUrl ? (
        <Box
          sx={{
            width: '100%',
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt=""
            sx={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }}
          />
        </Box>
      ) : null}

      <Typography
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: imageUrl ? 1.5 : 3,
          fontSize: { xs: '1.1rem', md: '1.25rem' },
          fontWeight: 700,
          color: c.text,
          textAlign: 'center',
          width: '100%',
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          minWidth: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${c.border}`,
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: c.textMuted,
          bgcolor: c.bg,
        }}
      >
        {index + 1}
      </Box>
    </Box>
  );
}
