import { createTheme, PaletteMode } from '@mui/material/styles';
import { duo, duoColors } from './duo/duo-theme';

export function createAppTheme(mode: PaletteMode) {
  const c = duoColors(mode);

  return createTheme({
    palette: {
      mode,
      primary: { main: duo.green, dark: duo.greenDark },
      secondary: { main: duo.blue },
      success: { main: duo.green },
      warning: { main: duo.yellow },
      error: { main: duo.red },
      background: { default: c.bg, paper: c.card },
      text: { primary: c.text, secondary: c.textMuted },
      divider: c.border,
    },
    typography: {
      fontFamily: '"din-round", "Nunito", "Varela Round", "Segoe UI", system-ui, sans-serif',
      button: { fontWeight: 800, textTransform: 'uppercase' as const },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { bgcolor: c.bg },
        },
      },
    },
  });
}
