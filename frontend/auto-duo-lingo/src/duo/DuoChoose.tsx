import { Alert, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Info, WS } from '../Types';
import { chooseOption, proceed } from '../Action';
import { useLesson } from '../context/LessonContext';
import { useChallengeKey } from '../hooks/useChallengeKey';
import DuoShell from './DuoShell';
import DuoPrompt, { displayPrompt } from './DuoPrompt';
import DuoChoiceCard from './DuoChoiceCard';
import { DuoFooterButton } from './DuoFooter';

export default function DuoChoose({ info, ws }: { info: Info; ws: WS }) {
  const { pending, onActionSent } = useLesson();
  const [selected, setSelected] = useState<string | null>(null);

  useChallengeKey(info, () => setSelected(null));

  const handleChoose = (op: string) => {
    if (pending || selected || info.rightAnswer) return;
    setSelected(op);
    onActionSent();
    chooseOption(op, ws);
  };

  const handleContinue = () => {
    onActionSent();
    proceed(ws);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= (info.options?.length ?? 0) && !info.rightAnswer && !pending && !selected) {
        handleChoose(info.options![n - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [info.options, info.rightAnswer, pending, selected]);

  const prompt = displayPrompt(info);
  const hasImages = info.optionImages?.some(Boolean);

  return (
    <DuoShell
      showFooter={!!info.rightAnswer}
      footer={
        info.rightAnswer ? (
          <DuoFooterButton label="Continue" onClick={handleContinue} variant="warning" fullWidth />
        ) : undefined
      }
    >
      {prompt && <DuoPrompt text={prompt} />}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 2, md: 3 },
          width: '100%',
        }}
      >
        {info.options?.map((op, i) => (
          <Box key={op} sx={{ width: hasImages ? { xs: '45%', sm: 160, md: 180 } : '100%', maxWidth: hasImages ? 200 : 400 }}>
            <DuoChoiceCard
              label={op}
              imageUrl={info.optionImages?.[i]}
              index={i}
              selected={selected === op}
              disabled={pending || selected !== null}
              onClick={() => handleChoose(op)}
            />
          </Box>
        ))}
      </Box>

      {info.rightAnswer && (
        <Alert severity="error" sx={{ mt: 4, width: '100%', borderRadius: 2 }}>
          Correct solution: <strong>{info.rightAnswer}</strong>
        </Alert>
      )}

      {info.error && (
        <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
          Retrying…
        </Alert>
      )}
    </DuoShell>
  );
}
