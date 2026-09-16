export const duo = {
  green: '#58CC02',
  greenDark: '#46A302',
  greenShadow: '#58A700',
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  purple: '#CE82FF',
  red: '#FF4B4B',
  yellow: '#FFC800',
  dark: {
    bg: '#131F24',
    card: '#131F24',
    border: '#37464F',
    borderLight: '#52656D',
    text: '#FFFFFF',
    textMuted: '#AFAFAF',
    footerDisabled: '#37464F',
    footerDisabledText: '#52656D',
    progressTrack: '#37464F',
  },
  light: {
    bg: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E5E5',
    borderLight: '#D1D5DB',
    text: '#4B4B4B',
    textMuted: '#777777',
    footerDisabled: '#E5E5E5',
    footerDisabledText: '#AFAFAF',
    progressTrack: '#E5E5E5',
  },
};

export function duoColors(mode: 'light' | 'dark') {
  return mode === 'dark' ? duo.dark : duo.light;
}
