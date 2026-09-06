package app

import (
	"strings"
	"time"

	"github.com/go-rod/rod"
)

const scrapeAudioJS = `() => {
	const urls = [];

	const add = (u) => {
		if (!u || typeof u !== 'string') return;
		if (/cloudfront|tts|\.mp3|audio|mpeg/i.test(u)) urls.push(u);
	};

	const scoreUrl = (url) => {
		let score = url.length;
		if (/\/token\//i.test(url)) score -= 1000;
		if (/\/sentence\//i.test(url)) score += 500;
		if (/\/file\//i.test(url)) score += 200;
		return score;
	};

	const rank = (list) => [...new Set(list)].sort((a, b) => scoreUrl(b) - scoreUrl(a));

	const getChallenge = () => {
		const el = document.querySelector('[data-test^="challenge challenge-"]');
		if (!el) return null;
		for (const key of Object.keys(el)) {
			if (!key.startsWith('__reactFiber') && !key.startsWith('__reactProps')) continue;
			let node = el[key];
			for (let i = 0; i < 30 && node; i++) {
				const props = node.memoizedProps || node.pendingProps;
				if (props?.challenge) return props.challenge;
				if (props?.value?.challenge) return props.value.challenge;
				node = node.return;
			}
		}
		return null;
	};

	const sentenceFields = (c) => {
		const out = [];
		const tryAdd = (v) => {
			if (typeof v === 'string') out.push(v);
			else if (v && typeof v === 'object' && typeof v.url === 'string') out.push(v.url);
			else if (v && typeof v === 'object' && typeof v.tts === 'string') out.push(v.tts);
		};
		tryAdd(c.tts);
		tryAdd(c.sentenceTts);
		tryAdd(c.fullTts);
		if (c.metadata) {
			tryAdd(c.metadata.tts);
			tryAdd(c.metadata.audioUrl);
			tryAdd(c.metadata.sourceTts);
		}
		if (c.prompt) {
			tryAdd(c.prompt);
			if (typeof c.prompt === 'object') {
				tryAdd(c.prompt.tts);
				tryAdd(c.prompt.audio);
				tryAdd(c.prompt.url);
			}
		}
		return out;
	};

	const findUrls = (obj, depth = 0) => {
		if (!obj || depth > 10) return;
		if (typeof obj === 'string') { add(obj); return; }
		if (typeof obj !== 'object') return;
		for (const k of Object.keys(obj)) findUrls(obj[k], depth + 1);
	};

	const challenge = getChallenge();
	if (challenge) {
		sentenceFields(challenge).forEach(add);
		findUrls(challenge);
	}

	document.querySelectorAll('audio, video').forEach(el => {
		add(el.src);
		add(el.currentSrc);
		const source = el.querySelector('source');
		if (source) add(source.src);
	});

	performance.getEntriesByType('resource')
		.filter(r => /cloudfront|tts|\.mp3|audio|mpeg/i.test(r.name))
		.sort((a, b) => b.responseEnd - a.responseEnd)
		.slice(0, 8)
		.forEach(r => add(r.name));

	const speakerSelectors = [
		'[data-test="challenge-speaker"]',
		'[data-test="speaker"]',
		'[data-test="challenge-listen"]',
		'[data-test^="challenge challenge-"] button:has(.animated-speaker-icon-lottie)',
		'[data-test^="challenge challenge-"] button:has(svg)',
		'button[aria-label*="Listen" i]',
		'button[aria-label*="Play" i]',
		'button[aria-label*="audio" i]',
	];
	let hasSpeaker = false;
	for (const sel of speakerSelectors) {
		try {
			if (document.querySelector(sel)) { hasSpeaker = true; break; }
		} catch (_) {}
	}

	const heading = document.querySelector('[data-test="challenge-header"]')?.innerText || '';
	const titleAudio = /sound|listen|speak|audio|hear/i.test(heading);
	const translateChallenge = !!document.querySelector('[data-test="challenge challenge-translate"]');
	const dialogueChallenge = !!document.querySelector('[data-test="challenge challenge-dialogue"]');

	return {
		urls: rank(urls),
		hasSpeaker: hasSpeaker || translateChallenge || dialogueChallenge,
		titleAudio,
	};
}`

const primeAudioJS = `() => {
	const speakerSelectors = [
		'[data-test="challenge-speaker"]',
		'[data-test="speaker"]',
		'[data-test="challenge-listen"]',
		'[data-test^="challenge challenge-"] button:has(.animated-speaker-icon-lottie)',
		'[data-test^="challenge challenge-"] button:has(svg)',
		'button[aria-label*="Listen" i]',
		'button[aria-label*="Play" i]',
	];
	const before = performance.getEntriesByType('resource').map(r => r.name);
	for (const sel of speakerSelectors) {
		try {
			const btn = document.querySelector(sel);
			if (btn) { btn.click(); return true; }
		} catch (_) {}
	}
	return false;
}`

const captureRecentAudioJS = `(before) => {
	const scoreUrl = (url) => {
		let score = url.length;
		if (/\/token\//i.test(url)) score -= 1000;
		if (/\/sentence\//i.test(url)) score += 500;
		return score;
	};
	const beforeSet = new Set(before);
	return performance.getEntriesByType('resource')
		.filter(r => /cloudfront|tts|\.mp3|audio|mpeg/i.test(r.name))
		.filter(r => !beforeSet.has(r.name))
		.sort((a, b) => scoreUrl(b.name) - scoreUrl(a.name) || b.responseEnd - a.responseEnd)
		.map(r => r.name);
}`

func scrapeAudio(pg *rod.Page) (urls []string, hasAudio bool) {
	result, err := pg.Eval(scrapeAudioJS)
	if err != nil {
		return nil, false
	}

	m, ok := result.Value.Val().(map[string]interface{})
	if !ok {
		return nil, false
	}

	if raw, ok := m["urls"].([]interface{}); ok {
		for _, item := range raw {
			if s, ok := item.(string); ok && s != "" {
				urls = append(urls, s)
			}
		}
	}

	hasSpeaker, _ := m["hasSpeaker"].(bool)
	titleAudio, _ := m["titleAudio"].(bool)
	hasAudio = len(urls) > 0 || hasSpeaker || titleAudio

	return pickBestAudioUrls(urls), hasAudio
}

func primeAudio(pg *rod.Page) []string {
	before, _ := evalStringArray(pg, `() => performance.getEntriesByType('resource').map(r => r.name)`)

	clicked, _ := pg.Eval(primeAudioJS)
	if clicked == nil || !clicked.Value.Bool() {
		return nil
	}

	pg.MustWaitIdle()
	time.Sleep(400 * time.Millisecond)

	recent, err := pg.Eval(captureRecentAudioJS, before)
	if err != nil {
		return nil
	}

	raw, ok := recent.Value.Val().([]interface{})
	if !ok || len(raw) == 0 {
		urls, _ := scrapeAudio(pg)
		return pickBestAudioUrls(urls)
	}

	out := make([]string, 0, len(raw))
	for _, item := range raw {
		if s, ok := item.(string); ok && s != "" {
			out = append(out, s)
		}
	}
	return pickBestAudioUrls(out)
}

func pickBestAudioUrls(urls []string) []string {
	if len(urls) == 0 {
		return urls
	}

	scored := make([]struct {
		url   string
		score int
	}, 0, len(urls))

	seen := map[string]bool{}
	for _, u := range urls {
		u = strings.TrimSpace(u)
		if u == "" || seen[u] {
			continue
		}
		seen[u] = true
		score := len(u)
		lower := strings.ToLower(u)
		if strings.Contains(lower, "/token/") {
			score -= 1000
		}
		if strings.Contains(lower, "/sentence/") {
			score += 500
		}
		if strings.Contains(lower, "/file/") {
			score += 200
		}
		scored = append(scored, struct {
			url   string
			score int
		}{u, score})
	}

	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	out := make([]string, 0, len(scored))
	for _, s := range scored {
		out = append(out, s.url)
	}
	return out
}

func dedupeStrings(items []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(items))
	for _, s := range items {
		s = strings.TrimSpace(s)
		if s == "" || seen[s] {
			continue
		}
		seen[s] = true
		out = append(out, s)
	}
	return out
}
