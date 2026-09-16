import { useEffect, useRef } from 'react';
import { Info } from '../Types';

export function challengeKey(info: Info): string {
  return `${info.type}:${info.title ?? ''}:${info.prompt ?? ''}:${info.progress}`;
}

export function useChallengeKey(info: Info, onChange?: () => void) {
  const keyRef = useRef(challengeKey(info));

  useEffect(() => {
    const next = challengeKey(info);
    if (keyRef.current !== next) {
      keyRef.current = next;
      onChange?.();
    }
  }, [info, onChange]);

  return keyRef.current;
}
