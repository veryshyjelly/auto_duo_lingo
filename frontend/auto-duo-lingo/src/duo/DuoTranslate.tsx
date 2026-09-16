import { Alert, Box, Chip, IconButton, InputAdornment, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useCallback, useState } from 'react';
import { Info, WS } from '../Types';
import { englishCheck, checkJapanese, proceed, getChips } from '../Action';
import { useLesson } from '../context/LessonContext';
import { useChallengeKey } from '../hooks/useChallengeKey';
import DuoShell from './DuoShell';
import DuoPrompt, { displayPrompt } from './DuoPrompt';
import DuoAudio from './DuoAudio';
import { DuoFooterButton } from './DuoFooter';
import { useThemeMode } from '../context/ThemeModeContext';
import { duoColors } from './duo-theme';
import { ChallengeType } from '../Types';

export default function DuoTranslate({ info, ws }: { info: Info; ws: WS }) {
  const isEnglish = info.type === ChallengeType.ToEnglish;
  const { pending, onActionSent } = useLesson();
  const { mode } = useThemeMode();
  const c = duoColors(mode);

  const [textInput, setTextInput] = useState('');

  const reset = useCallback(() => setTextInput(''), []);
  useChallengeKey(info, reset);

  const matchedChips = isEnglish
    ? (getChips(info.options || [], textInput) || [])
    : [];

  const canCheck = isEnglish
    ? matchedChips.length > 0
    : textInput.trim().length > 0;

  const handleCheck = () => {
    if (!canCheck || pending) return;
    onActionSent();
    if (isEnglish) englishCheck(matchedChips, ws);
    else checkJapanese(textInput, ws);
  };

  const handleSkip = () => {
    onActionSent();
    proceed(ws);
  };

  const handleContinue = () => {
    onActionSent();
    proceed(ws);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  const appendChip = (op: string) => {
    if (pending) return;
    const next = textInput ? `${textInput} ${op}` : op;
    setTextInput(next);
  };

  const prompt = displayPrompt(info);

  return (
    <DuoShell
      showFooter
      footer={
        info.rightAnswer ? (
          <DuoFooterButton label="Continue" onClick={handleContinue} variant="warning" fullWidth />
        ) : (
          <>
            <DuoFooterButton label="Skip" onClick={handleSkip} variant="outline" disabled={pending} />
            <DuoFooterButton
              label="Check"
              onClick={handleCheck}
              variant="primary"
              disabled={!canCheck || pending}
              fullWidth
            />
          </>
        )
      }
    >
      {prompt && <DuoPrompt text={prompt} />}

      {!isEnglish && <DuoAudio info={info} ws={ws} />}

      {isEnglish ? (
        <>
          <TextField
            multiline
            rows={3}
            fullWidth
            autoFocus
            variant="outlined"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type in English"
            sx={{
              mb: 3,
              '& .MuiInputBase-input': {
                fontSize: '1.25rem',
                fontWeight: 600,
                lineHeight: 1.5,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            }}
            slotProps={{
              input: {
                endAdornment: textInput ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setTextInput('')} aria-label="Clear" edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: '100%', justifyContent: 'center' }}>
            {info.options?.map((op) => {
              const used = matchedChips.some(
                (chip) => chip.toUpperCase() === op.toUpperCase()
              );
              return (
                <Chip
                  key={op}
                  label={op}
                  onClick={() => appendChip(op)}
                  variant="outlined"
                  color={used ? 'secondary' : 'default'}
                  sx={{
                    fontSize: '1.1rem',
                    py: 2.5,
                    borderWidth: 2,
                    borderColor: used ? '#1CB0F6' : c.border,
                    bgcolor: used
                      ? (mode === 'dark' ? 'rgba(28, 176, 246, 0.15)' : 'rgba(28, 176, 246, 0.1)')
                      : c.card,
                    fontWeight: 700,
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#1CB0F6' },
                  }}
                />
              );
            })}
          </Box>
        </>
      ) : (
        <Box
          component="textarea"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={info.inputPlaceholder || 'Type your translation'}
          lang={info.inputLang || undefined}
          autoFocus
          sx={{
            width: '100%',
            minHeight: 120,
            p: 2,
            border: `2px solid ${c.border}`,
            borderRadius: 2,
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            color: c.text,
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            '&:focus': { borderColor: '#1CB0F6' },
          }}
        />
      )}

      {info.rightAnswer && (
        <Alert severity="error" sx={{ mt: 4, width: '100%' }}>
          Correct solution: <strong>{info.rightAnswer}</strong>
        </Alert>
      )}
    </DuoShell>
  );
}
