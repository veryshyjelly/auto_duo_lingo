import { Alert, Box, IconButton, InputAdornment, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeType, Info, WS } from '../Types';
import {
  chooseOption, englishCheck, checkJapanese, matchOption,
  proceed, playAudio, getChips,
} from '../Action';
import { useLesson } from '../context/LessonContext';
import { useChallengeKey } from '../hooks/useChallengeKey';
import DuoShell from '../duo/DuoShell';
import { DuoFooterButton } from '../duo/DuoFooter';
import { useThemeMode } from '../context/ThemeModeContext';

const STRIP_SELECTORS = 'script, iframe, noscript, object, embed, link, style, form, [class*="recaptcha"], [id*="recaptcha"], [data-sitekey]';

function sanitizeMount(root: ParentNode) {
  root.querySelectorAll(STRIP_SELECTORS).forEach((el) => el.remove());
}

/** Duolingo card chrome uses ::before with z-index:-1; overflow:hidden on wrappers clips it. */
function unblockCardDecorations(shadow: ShadowRoot) {
  shadow.querySelectorAll('[data-mirror-mount] *').forEach((el) => {
    const node = el as HTMLElement;
    if (getComputedStyle(node).overflow === 'hidden') {
      node.style.setProperty('overflow', 'visible', 'important');
    }
  });
}

/** Duolingo lesson shell uses position:fixed full-screen layers that escape shadow bounds. */
function stripFullscreenOverlays(shadow: ShadowRoot) {
  shadow.querySelectorAll('*').forEach((el) => {
    const node = el as HTMLElement;
    const s = getComputedStyle(node);
    if (s.position === 'fixed') {
      node.style.setProperty('display', 'none', 'important');
      return;
    }
    if (
      s.position === 'absolute'
      && node.offsetWidth >= window.innerWidth * 0.9
      && node.offsetHeight >= window.innerHeight * 0.9
      && Number.parseInt(s.zIndex || '0', 10) >= 100
    ) {
      node.style.setProperty('display', 'none', 'important');
    }
  });
}

function proxiedCssHref(href: string): string {
  return `/duo-css?url=${encodeURIComponent(href)}`;
}

async function injectStylesheet(shadow: ShadowRoot, href: string, index: number): Promise<void> {
  try {
    const res = await fetch(proxiedCssHref(href));
    if (!res.ok) return;
    const css = await res.text();
    if (!css.trim()) return;
    const el = document.createElement('style');
    el.setAttribute('data-mirror-sheet', String(index));
    el.textContent = css;
    shadow.appendChild(el);
  } catch {
    // skip failed sheet
  }
}

function injectStylesheetWithTimeout(
  shadow: ShadowRoot,
  href: string,
  index: number,
  ms = 6000,
): Promise<void> {
  return Promise.race([
    injectStylesheet(shadow, href, index),
    new Promise<void>((resolve) => { setTimeout(resolve, ms); }),
  ]);
}

const PATCH_STYLE = `
  :host {
    display: block;
    width: 100%;
    min-height: 120px;
    color-scheme: light dark;
    background-color: var(--color-snow, #ffffff);
    color: var(--color-black, #4b4b4b);
    font-family: din-round, "Nunito", sans-serif;
  }
  :host([data-theme="dark"]) {
    background-color: var(--color-black, #131f24);
    color: var(--color-snow, #ffffff);
  }
  [data-mirror-used="true"] {
    opacity: 0.45 !important;
    pointer-events: none !important;
  }
  [data-mirror-selected="true"] {
    outline: 3px solid #1CB0F6 !important;
    outline-offset: 2px;
  }
  [data-test="challenge-translate-input"] {
    pointer-events: auto !important;
  }
  button, [role="button"] {
    cursor: pointer !important;
  }
`;

type ChallengeMirrorProps = {
  info: Info;
  ws: WS;
};

export default function ChallengeMirror({ info, ws }: ChallengeMirrorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const { pending, onActionSent } = useLesson();
  const { mode } = useThemeMode();

  const [typedEnglish, setTypedEnglish] = useState('');
  const [japaneseInput, setJapaneseInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [mirrorReady, setMirrorReady] = useState(false);

  const isEnglish = info.type === ChallengeType.ToEnglish;
  const isJapanese = info.type === ChallengeType.ToJapanese;
  const needsCheck = isEnglish || isJapanese;

  const matchedChips = isEnglish
    ? (getChips(info.options || [], typedEnglish) || [])
    : [];

  const reset = useCallback(() => {
    setTypedEnglish('');
    setJapaneseInput('');
    setSelected(null);
  }, []);
  useChallengeKey(info, reset);

  const highlightWordBank = useCallback((chips: string[]) => {
    const root = shadowRef.current;
    if (!root) return;
    const used = new Set(chips.map(c => c.toUpperCase()));
    root.querySelectorAll('[data-test="challenge-tap-token-text"]').forEach((el) => {
      const text = el.textContent?.trim() || '';
      const token = el.closest('[data-test$="-challenge-tap-token"]') as HTMLElement | null;
      if (token) {
        token.dataset.mirrorUsed = used.has(text.toUpperCase()) ? 'true' : 'false';
      }
    });
  }, []);

  const handleCheck = () => {
    if (pending) return;
    onActionSent();
    if (isEnglish) englishCheck(matchedChips, ws);
    else if (isJapanese) checkJapanese(japaneseInput.trim(), ws);
  };

  const handleContinue = () => {
    onActionSent();
    proceed(ws);
  };

  const handleSkip = () => {
    onActionSent();
    proceed(ws);
  };

  const canCheck = isEnglish
    ? matchedChips.length > 0
    : isJapanese
      ? japaneseInput.trim().length > 0
      : false;

  // Mount Duolingo HTML into shadow DOM — show content first, load CSS in background.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !info.challengeHtml) {
      setMirrorReady(false);
      return;
    }

    host.dataset.theme = mode;

    let shadow = host.shadowRoot;
    if (!shadow || shadow.host !== host) {
      shadow = host.attachShadow({ mode: 'open' });
    }
    shadowRef.current = shadow;
    shadow.innerHTML = '';

    const patch = document.createElement('style');
    patch.textContent = PATCH_STYLE + (info.designTokens ? `\n${info.designTokens}` : '');
    shadow.appendChild(patch);

    const mount = document.createElement('div');
    mount.setAttribute('data-mirror-mount', 'true');
    mount.innerHTML = info.challengeHtml;
    sanitizeMount(mount);
    shadow.appendChild(mount);

    shadow.querySelectorAll('[data-test="player-next"], [data-test="player-skip"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    stripFullscreenOverlays(shadow);
    unblockCardDecorations(shadow);
    highlightWordBank(matchedChips);
    setMirrorReady(true);

    let cancelled = false;
    const hrefs = (info.styleHrefs || []).filter((h) => !/darkreader/i.test(h));

    Promise.all(hrefs.map((href, i) => injectStylesheetWithTimeout(shadow!, href, i)))
      .then(() => {
        if (!cancelled) {
          stripFullscreenOverlays(shadow!);
          unblockCardDecorations(shadow!);
        }
      });

    return () => { cancelled = true; };
  }, [info.challengeHtml, info.styleHrefs, info.designTokens, mode]);

  // Monkey-patch interactions
  useEffect(() => {
    const shadow = shadowRef.current;
    if (!shadow || !info.challengeHtml) return;

    const cleanups: (() => void)[] = [];

    const onChoose = (text: string) => {
      if (pending || selected || info.rightAnswer) return;
      setSelected(text);
      onActionSent();
      chooseOption(text, ws);
    };

    // Dialogue + choose: judge text buttons
    shadow.querySelectorAll('[data-test="challenge-judge-text"]').forEach((el) => {
      const text = el.textContent?.trim() || '';
      const btn = el.closest('button') || el.parentElement;
      if (!btn || !text) return;
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onChoose(text);
      };
      btn.addEventListener('click', handler, true);
      cleanups.push(() => btn.removeEventListener('click', handler, true));
    });

    // Image/text choice cards
    shadow.querySelectorAll('[data-test="challenge-choice"]').forEach((choice) => {
      const textEl = choice.querySelector('[dir="ltr"]');
      const text = textEl?.textContent?.trim() || '';
      if (!text) return;
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onChoose(text);
      };
      choice.addEventListener('click', handler, true);
      cleanups.push(() => choice.removeEventListener('click', handler, true));
    });

    // Matching tap tokens
    if (info.type === ChallengeType.Matching) {
      shadow.querySelectorAll('[data-test="challenge-tap-token-text"]').forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (!text) return;
        const btn = el.closest('[data-test$="-challenge-tap-token"]') || el.parentElement;
        if (!btn) return;
        const handler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          if (pending) return;
          onActionSent();
          matchOption(info.prompt || '', text, ws);
        };
        btn.addEventListener('click', handler, true);
        cleanups.push(() => btn.removeEventListener('click', handler, true));
      });
    }

    // Speaker buttons → proxy audio
    shadow.querySelectorAll('button').forEach((btn) => {
      if (!btn.querySelector('svg, .animated-speaker-icon-lottie')) return;
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        playAudio(ws);
      };
      btn.addEventListener('click', handler, true);
      cleanups.push(() => btn.removeEventListener('click', handler, true));
    });

    // Enable translate input in mirror
    const translateInput = shadow.querySelector('[data-test="challenge-translate-input"]') as HTMLTextAreaElement | null;
    if (translateInput) {
      translateInput.disabled = false;
      translateInput.readOnly = false;
      translateInput.style.pointerEvents = 'auto';
      const onInput = () => setJapaneseInput(translateInput.value);
      translateInput.addEventListener('input', onInput);
      cleanups.push(() => translateInput.removeEventListener('input', onInput));
      setJapaneseInput(translateInput.value);
    }

    // Keyboard shortcuts for numbered options
    const keyHandler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      const options = info.options || [];
      if (n >= 1 && n <= options.length && !info.rightAnswer && !pending && !selected) {
        onChoose(options[n - 1]);
      }
    };
    window.addEventListener('keydown', keyHandler);
    cleanups.push(() => window.removeEventListener('keydown', keyHandler));

    return () => cleanups.forEach(fn => fn());
  }, [info, ws, pending, selected, onActionSent]);

  useEffect(() => {
    highlightWordBank(matchedChips);
  }, [matchedChips, highlightWordBank, info.challengeHtml]);

  const showFooter = !!info.rightAnswer || needsCheck;

  return (
    <DuoShell
      showFooter={showFooter}
      footer={
        info.rightAnswer ? (
          <DuoFooterButton label="Continue" onClick={handleContinue} variant="warning" fullWidth />
        ) : needsCheck ? (
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
        ) : null
      }
    >
      {isEnglish && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <TextField
            multiline
            rows={2}
            fullWidth
            autoFocus
            variant="outlined"
            value={typedEnglish}
            onChange={(e) => setTypedEnglish(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canCheck) {
                e.preventDefault();
                handleCheck();
              }
            }}
            placeholder="Type in English"
            sx={{
              '& .MuiInputBase-input': { fontSize: '1.15rem', fontWeight: 600 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            }}
            slotProps={{
              input: {
                endAdornment: typedEnglish ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setTypedEnglish('')} aria-label="Clear">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Box>
      )}

      <Box
        ref={hostRef}
        sx={{
          width: '100%',
          maxWidth: 720,
          mx: 'auto',
          minHeight: 120,
          opacity: mirrorReady ? 1 : 0.85,
          transition: 'opacity 0.15s ease',
        }}
      />

      {!info.challengeHtml && (
        <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
          Challenge mirror not available — refresh or check the lesson browser connection.
        </Alert>
      )}

      {info.rightAnswer && (
        <Alert severity="error" sx={{ mt: 3, width: '100%' }}>
          Correct solution: <strong>{info.rightAnswer}</strong>
        </Alert>
      )}
    </DuoShell>
  );
}
