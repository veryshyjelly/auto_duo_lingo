import { Alert } from '@mui/material';
import { ChallengeType, Info, WS } from './Types';
import { useLesson } from './context/LessonContext';
import ChallengeMirror from './mirror/ChallengeMirror';
import DuoStart from './duo/DuoStart';

function ChallengeRouter({ info, ws }: { info: Info; ws: WS }) {
  if (info.type === ChallengeType.Nothing) {
    return <DuoStart />;
  }

  if (info.challengeHtml) {
    return <ChallengeMirror info={info} ws={ws} />;
  }

  return <DuoStart />;
}

export default function App() {
  const { info, ws, authError, connectionState } = useLesson();

  if (authError) {
    return (
      <>
        <Alert severity="error" sx={{ m: 2 }}>
          Invalid auth token — check the URL includes ?token=...
        </Alert>
        <DuoStart />
      </>
    );
  }

  return (
    <>
      {connectionState === 'reconnecting' && (
        <Alert severity="warning" sx={{ position: 'fixed', top: 60, left: 16, right: 16, zIndex: 200, borderRadius: 2 }}>
          Reconnecting…
        </Alert>
      )}
      <ChallengeRouter info={info} ws={ws} />
    </>
  );
}
