import { Alert, Box } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeType, Info, WS } from '../Types';
import {
  chooseOption, englishCheck, checkJapanese, matchOption,
  proceed, playAudio, playProxiedAudio, getChips,
} from '../Action';
import { useLesson } from '../context/LessonContext';
import { useChallengeKey } from '../hooks/useChallengeKey';
import DuoShell from '../duo/DuoShell';
import { DuoFooterButton } from '../duo/DuoFooter';
import DuoAudio from '../duo/DuoAudio';
import { useThemeMode } from '../context/ThemeModeContext';

const STRIP_SELECTORS = 'script, iframe, noscript, object, embed, link, style, form, [class*="recaptcha"], [id*="recaptcha"], [data-sitekey], link[rel="modulepreload"], link[as="script"]';

/** Remove Duolingo's chip answer slots (horizontal lines) — replaced by mirror text input. */
function isEmptySlotTree(el: Element): boolean {
  if (el.querySelector(
    'button, img, input, textarea, [data-test="word-bank"], [data-test="challenge-header"], [data-test="challenge-choice"]',
  )) {
    return false;
  }
  if (el.textContent?.trim()) return false;
  if (el.children.length === 0) return true;
  return [...el.children].every((child) => child.tagName === 'DIV' && isEmptySlotTree(child));
}

function removeEnglishAnswerSlots(root: ParentNode) {
  root.querySelectorAll('[data-test="challenge-text-input"]').forEach((el) => el.remove());

  root.querySelectorAll('[data-test$="-challenge-tap-token"]').forEach((el) => {
    if (!el.closest('[data-test="word-bank"]')) el.remove();
  });

  // Multi-line slot stacks (5+ empty underline rows)
  root.querySelectorAll('div').forEach((div) => {
    if (div.closest('[data-test="word-bank"]')) return;
    if (div.closest('[data-mirror-english-input]')) return;
    const kids = [...div.children];
    if (kids.length < 2) return;
    const isLineStack = kids.every((child) => (
      child.tagName === 'DIV'
      && !child.textContent?.trim()
      && !child.querySelector('button, img, input, textarea, [data-test]')
    ));
    if (isLineStack) div.remove();
  });

  const wordBank = root.querySelector('[data-test="word-bank"]');
  if (!wordBank) return;

  // Word-bank column: drop siblings that only hold the slot area
  const wordBankCol = wordBank.parentElement;
  if (wordBankCol) {
    [...wordBankCol.children].forEach((child) => {
      if (child === wordBank) return;
      if (child.hasAttribute('data-mirror-english-input')) return;
      const keep = child.querySelector(
        'img, picture, [data-test="challenge-header"], [data-test="challenge-choice"], [data-test="challenge-judge-text"]',
      );
      if (keep) return;
      if (isEmptySlotTree(child)) child.remove();
    });

    // Slot area above the column (e.g. Sa7Uw > MvChQ + _1v1Bd)
    const row = wordBankCol.parentElement;
    if (row) {
      [...row.children].forEach((sibling) => {
        if (sibling === wordBankCol || sibling.contains(wordBank)) return;
        if (sibling.hasAttribute('data-mirror-english-input')) return;
        if (sibling.querySelector(
          'img, picture, [data-test="challenge-header"], [data-test="challenge-choice"], [data-test="word-bank"]',
        )) return;
        if (isEmptySlotTree(sibling)) sibling.remove();
      });
    }
  }

  // Final sweep: any remaining empty slot subtrees outside word-bank
  root.querySelectorAll('div').forEach((div) => {
    if (div.closest('[data-test="word-bank"]')) return;
    if (div.closest('[data-mirror-english-input]')) return;
    if (isEmptySlotTree(div) && div.children.length <= 1) div.remove();
  });
}


/** Strip executable content — mirror is HTML/CSS only; interactions are ours. */
function disableMirrorJavascript(root: ParentNode) {
  root.querySelectorAll(STRIP_SELECTORS).forEach((el) => el.remove());
  root.querySelectorAll('*').forEach((el) => {
    if (!(el instanceof Element)) return;
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value?.trim().toLowerCase() ?? '';
      if (name.startsWith('on') || name === 'srcdoc') {
        el.removeAttribute(attr.name);
        return;
      }
      if (
        (name === 'href' || name === 'src' || name === 'action' || name === 'xlink:href')
        && (val.startsWith('javascript:') || val.startsWith('vbscript:'))
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
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
  script, noscript, iframe, object, embed {
    display: none !important;
    pointer-events: none !important;
  }
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
  [data-mirror-to-english] [data-test="challenge-text-input"] {
    display: none !important;
  }
  [data-mirror-to-english] [data-test="word-bank"] {
    position: static !important;
    inset: auto !important;
    transform: none !important;
    margin-top: 12px;
  }
  [data-test="challenge challenge-tapComplete"] [dir="ltr"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: baseline !important;
    gap: 2px 4px;
    width: 100%;
  }
  [data-test="challenge challenge-tapComplete"] [dir="ltr"] > * {
    display: inline-flex !important;
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: none !important;
  }
  [data-test="challenge challenge-tapComplete"] span[lang="ja"] {
    display: inline-flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: baseline !important;
  }
  [data-test="challenge challenge-tapComplete"] span[lang="ja"] > span {
    display: inline !important;
  }
  [data-test="challenge challenge-tapComplete"] img {
    flex: 0 0 auto;
    max-width: 140px;
    height: auto;
    margin-right: 12px;
  }
  [data-mirror-mount] [data-test="challenge challenge-tapComplete"] > div > div:has([dir="ltr"]) {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 12px;
    width: 100%;
  }
  [data-test="challenge challenge-tapComplete"] [data-test="word-bank"] {
    position: static !important;
    inset: auto !important;
    transform: none !important;
    margin-top: 16px;
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 8px;
  }
  [data-mirror-used="true"] {
    opacity: 0.45 !important;
    pointer-events: none !important;
  }
  [data-mirror-mount] [data-test="challenge-choice"],
  [data-mirror-mount] [data-test="challenge-judge-text"],
  [data-mirror-mount] [data-test$="-challenge-tap-token"],
  [data-mirror-mount] button,
  [data-mirror-mount] [role="radio"],
  [data-mirror-mount] [role="button"] {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  [data-mirror-selected="true"] {
    outline: 3px solid #1CB0F6 !important;
    outline-offset: 2px;
  }
  [data-test="challenge-translate-input"] {
    pointer-events: auto !important;
  }
  [data-test="word-bank"] [data-test$="-challenge-tap-token"] {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  [data-mirror-english-input] {
    width: 100%;
    padding: 8px 0 16px;
  }
  [data-mirror-english-input] textarea {
    width: 100%;
    min-height: 72px;
    padding: 12px 16px;
    border: 2px solid var(--color-swan, #afafaf);
    border-radius: 12px;
    background: transparent;
    color: inherit;
    font-size: 1.2rem;
    font-weight: 700;
    font-family: inherit;
    resize: none;
    outline: none;
    box-sizing: border-box;
    pointer-events: auto !important;
  }
  [data-mirror-english-input] textarea:focus {
    border-color: var(--color-blue-jay, #1cb0f6);
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
  const englishInputRef = useRef<HTMLTextAreaElement | null>(null);
  const actionStateRef = useRef({
    pending: false,
    selected: null as string | null,
    info: null as Info | null,
    ws: null as WS | null,
    type: ChallengeType.Nothing,
    onActionSent: () => {},
    appendEnglishWord: (_w: string) => {},
    handleCheck: () => {},
    canCheck: false,
  });
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
    root.querySelectorAll('[data-test="word-bank"] [data-test="challenge-tap-token-text"]').forEach((el) => {
      const text = el.textContent?.trim() || '';
      const token = el.closest('[data-test$="-challenge-tap-token"]') as HTMLElement | null;
      if (token) {
        token.dataset.mirrorUsed = used.has(text.toUpperCase()) ? 'true' : 'false';
      }
    });
  }, []);

  const appendEnglishWord = useCallback((word: string) => {
    setTypedEnglish((prev) => (prev ? `${prev} ${word}` : word));
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

  actionStateRef.current = {
    pending,
    selected,
    info,
    ws,
    type: info.type,
    onActionSent,
    appendEnglishWord,
    handleCheck,
    canCheck,
  };

  const handleMirrorPointer = useCallback((e: Event) => {
    const shadow = shadowRef.current;
    if (!shadow) return;

    const target = e.target;
    if (!(target instanceof Element) || !shadow.contains(target)) return;

    if (target.closest('[data-mirror-english-input], [data-test="challenge-translate-input"]')) {
      return;
    }

    const s = actionStateRef.current;
    const current = s.info;
    if (!current || !s.ws) return;

    const pickChoice = (text: string) => {
      if (s.pending || s.selected || current.rightAnswer) return;
      setSelected(text);
      s.onActionSent();
      chooseOption(text, s.ws!);
    };

    const speakerBtn = target.closest('button');
    if (speakerBtn?.querySelector('svg, .animated-speaker-icon-lottie')) {
      e.preventDefault();
      e.stopPropagation();
      const url = current.audioUrls?.[0];
      if (url) {
        playProxiedAudio(url).catch(() => playAudio(s.ws!));
      } else {
        playAudio(s.ws!);
      }
      return;
    }

    const token = target.closest('[data-test$="-challenge-tap-token"]');

    if (token?.closest('[data-test="word-bank"]') && s.type === ChallengeType.ToEnglish) {
      e.preventDefault();
      e.stopPropagation();
      if (s.pending || current.rightAnswer) return;
      const text = token.querySelector('[data-test="challenge-tap-token-text"]')?.textContent?.trim();
      if (text) s.appendEnglishWord(text);
      return;
    }

    if (token?.closest('[data-test="word-bank"]') && s.type === ChallengeType.ChooseOption) {
      e.preventDefault();
      e.stopPropagation();
      const text = token.querySelector('[data-test="challenge-tap-token-text"]')?.textContent?.trim();
      if (text) pickChoice(text);
      return;
    }

    if (s.type === ChallengeType.Matching && token && !token.closest('[data-test="word-bank"]')) {
      e.preventDefault();
      e.stopPropagation();
      if (s.pending) return;
      const text = token.querySelector('[data-test="challenge-tap-token-text"]')?.textContent?.trim();
      if (text) {
        s.onActionSent();
        matchOption(current.prompt || '', text, s.ws);
      }
      return;
    }

    const choice = target.closest('[data-test="challenge-choice"]');
    if (choice) {
      e.preventDefault();
      e.stopPropagation();
      const text = choice.querySelector('[dir="ltr"]')?.textContent?.trim()
        || choice.textContent?.trim();
      if (text) pickChoice(text);
      return;
    }

    const judge = target.closest('[data-test="challenge-judge-text"]');
    if (judge) {
      e.preventDefault();
      e.stopPropagation();
      const text = judge.textContent?.trim();
      if (text) pickChoice(text);
      return;
    }

    const judgeHost = target.closest('button, [role="button"]');
    const judgeText = judgeHost?.querySelector('[data-test="challenge-judge-text"]')?.textContent?.trim();
    if (judgeText) {
      e.preventDefault();
      e.stopPropagation();
      pickChoice(judgeText);
    }
  }, []);

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
    disableMirrorJavascript(mount);
    shadow.appendChild(mount);

    shadow.querySelectorAll('[data-test="player-next"], [data-test="player-skip"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    stripFullscreenOverlays(shadow);
    unblockCardDecorations(shadow);

    if (info.type === ChallengeType.ToEnglish) {
      mount.setAttribute('data-mirror-to-english', 'true');
      removeEnglishAnswerSlots(mount);
      const wordBank = shadow.querySelector('[data-test="word-bank"]');
      if (wordBank?.parentElement) {
        const slot = document.createElement('div');
        slot.setAttribute('data-mirror-english-input', 'true');
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type in English';
        textarea.rows = 2;
        slot.appendChild(textarea);
        wordBank.parentElement.insertBefore(slot, wordBank);
        englishInputRef.current = textarea;
      }
    }

    highlightWordBank([]);
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
  }, [info.challengeHtml, info.styleHrefs, info.designTokens, info.type, mode]);

  // Delegated tap/click on shadow root — survives CSS reloads, works on mobile.
  useEffect(() => {
    const shadow = shadowRef.current;
    if (!shadow || !mirrorReady) return;

    shadow.addEventListener('pointerup', handleMirrorPointer, true);

    const translateInput = shadow.querySelector('[data-test="challenge-translate-input"]') as HTMLTextAreaElement | null;
    if (translateInput) {
      translateInput.disabled = false;
      translateInput.readOnly = false;
      const onInput = () => setJapaneseInput(translateInput.value);
      translateInput.addEventListener('input', onInput);
      setJapaneseInput(translateInput.value);
      return () => {
        shadow.removeEventListener('pointerup', handleMirrorPointer, true);
        translateInput.removeEventListener('input', onInput);
      };
    }

    return () => {
      shadow.removeEventListener('pointerup', handleMirrorPointer, true);
    };
  }, [mirrorReady, info.challengeHtml, handleMirrorPointer]);

  // Number keys 1-9 for quick option select
  useEffect(() => {
    if (!mirrorReady) return;
    const keyHandler = (e: KeyboardEvent) => {
      const s = actionStateRef.current;
      const n = parseInt(e.key, 10);
      const options = s.info?.options || [];
      if (n >= 1 && n <= options.length && !s.info?.rightAnswer && !s.pending && !s.selected) {
        setSelected(options[n - 1]);
        s.onActionSent();
        chooseOption(options[n - 1], s.ws!);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [mirrorReady, info.challengeHtml]);

  // ToEnglish textarea
  useEffect(() => {
    const shadow = shadowRef.current;
    if (!shadow || !mirrorReady || info.type !== ChallengeType.ToEnglish) return;

    const englishInput = shadow.querySelector('[data-mirror-english-input] textarea') as HTMLTextAreaElement | null;
    if (!englishInput) return;

    const onInput = () => setTypedEnglish(englishInput.value);
    const onKeyDown = (e: KeyboardEvent) => {
      const s = actionStateRef.current;
      if (e.key === 'Enter' && !e.shiftKey && s.canCheck && !s.pending) {
        e.preventDefault();
        s.handleCheck();
      }
    };
    englishInput.addEventListener('input', onInput);
    englishInput.addEventListener('keydown', onKeyDown);
    englishInput.focus();
    return () => {
      englishInput.removeEventListener('input', onInput);
      englishInput.removeEventListener('keydown', onKeyDown);
    };
  }, [mirrorReady, info.challengeHtml, info.type]);

  useEffect(() => {
    if (!info.rightAnswer) setSelected(null);
  }, [info.challengeHtml, info.rightAnswer]);

  useEffect(() => {
    const ta = englishInputRef.current;
    if (!ta) return;
    if (document.activeElement !== ta && ta.value !== typedEnglish) {
      ta.value = typedEnglish;
    }
    highlightWordBank(matchedChips);
  }, [typedEnglish, matchedChips, highlightWordBank]);

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
      {(info.hasAudio || info.audioUrls?.length) && (
        <DuoAudio info={info} ws={ws} />
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
