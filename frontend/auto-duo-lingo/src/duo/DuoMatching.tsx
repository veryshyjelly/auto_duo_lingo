import { Alert, Box, Typography } from '@mui/material';
import { useState } from 'react';
import { Info, WS } from '../Types';
import { matchOption, proceed } from '../Action';
import { useLesson } from '../context/LessonContext';
import { useChallengeKey } from '../hooks/useChallengeKey';
import DuoShell from './DuoShell';
import DuoChoiceCard from './DuoChoiceCard';
import { DuoFooterButton } from './DuoFooter';
import { duo } from './duo-theme';

export default function DuoMatching({ info, ws }: { info: Info; ws: WS }) {
  const { pending, onActionSent } = useLesson();
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  useChallengeKey(info, () => {
    setSelected(null);
    setMatched(new Set());
  });

  const handleSelect = (op: string) => {
    if (pending || matched.has(op)) return;
    setSelected(op);
    onActionSent();
    matchOption(info.prompt || '', op, ws);
    setMatched(prev => new Set(prev).add(op));
  };

  const handleContinue = () => {
    onActionSent();
    proceed(ws);
  };

  return (
    <DuoShell
      showFooter={!!info.rightAnswer}
      footer={
        info.rightAnswer ? (
          <DuoFooterButton label="Continue" onClick={handleContinue} variant="warning" fullWidth />
        ) : undefined
      }
    >
      {info.prompt && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: duo.purple, textTransform: 'uppercase', mb: 1 }}>
            Match the pairs
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `2px solid ${duo.blue}`,
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {info.prompt}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, width: '100%' }}>
        {info.options?.map((op, i) => (
          <Box key={op} sx={{ width: { xs: '45%', sm: 160 }, maxWidth: 200 }}>
            <DuoChoiceCard
              label={op}
              imageUrl={info.optionImages?.[i]}
              index={i}
              selected={selected === op}
              disabled={pending || matched.has(op)}
              onClick={() => handleSelect(op)}
            />
          </Box>
        ))}
      </Box>

      {info.rightAnswer && (
        <Alert severity="error" sx={{ mt: 4, width: '100%' }}>
          Correct solution: <strong>{info.rightAnswer}</strong>
        </Alert>
      )}
    </DuoShell>
  );
}
