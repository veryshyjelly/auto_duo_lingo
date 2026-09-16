package app

import (
	"strings"

	"github.com/go-rod/rod"
)

// Scrapes challenge markup + Duolingo stylesheet URLs from the lesson browser.
// HTML is sanitized (no scripts, iframes, recaptcha). CSS is hrefs only — not inlined.
const scrapeChallengeMirrorJS = `() => {
	const base = location.origin;

	const absolutizeUrl = (url) => {
		if (!url) return url;
		const trimmed = url.trim();
		if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
		if (trimmed.startsWith('//')) return 'https:' + trimmed;
		if (trimmed.startsWith('/')) return base + trimmed;
		return trimmed;
	};

	const isDuoStylesheet = (href) => /duolingo|duocdn|d35aaqx5ub95lt|dwzcxfhh6qbm2|cloudfront\.net/i.test(href);

	const STRIP_TAGS = 'script, iframe, noscript, object, embed, link, style, video, audio, source, picture, template, form';
	const STRIP_SEL = '[class*="recaptcha"], [id*="recaptcha"], .grecaptcha-badge, [data-sitekey], [src*="recaptcha"], [href*="recaptcha"]';

	const sanitize = (root) => {
		root.querySelectorAll('picture').forEach((pic) => {
			const img = pic.querySelector('img');
			if (img) pic.replaceWith(img.cloneNode(true));
			else pic.remove();
		});
		root.querySelectorAll(STRIP_TAGS).forEach((el) => el.remove());
		root.querySelectorAll(STRIP_SEL).forEach((el) => el.remove());
		root.querySelectorAll('link[rel="modulepreload"], link[as="script"]').forEach((el) => el.remove());
		root.querySelectorAll('*').forEach((el) => {
			[...el.attributes].forEach((attr) => {
				const name = attr.name.toLowerCase();
				const val = (attr.value || '').trim().toLowerCase();
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
	};

	const absolutizeMedia = (root) => {
		root.querySelectorAll('[src], [href]').forEach((el) => {
			for (const attr of ['src', 'href']) {
				const val = el.getAttribute(attr);
				if (val && !val.startsWith('data:')) el.setAttribute(attr, absolutizeUrl(val));
			}
		});
	};

	const challenge = document.querySelector('[data-test^="challenge challenge-"]');
	if (!challenge) return { html: '', styleHrefs: [], designTokens: '' };

	const header = document.querySelector('[data-test="challenge-header"]');
	// Smallest wrapper: parent that holds header + challenge — never walk up to lesson shell.
	let container = challenge;
	if (header && challenge.parentElement?.contains(header)) {
		container = challenge.parentElement;
	}

	const wrap = document.createElement('div');
	wrap.setAttribute('data-mirror-root', 'true');

	const clone = container.cloneNode(true);
	sanitize(clone);
	// Duolingo sometimes nests duplicate headers in the challenge wrapper.
	const headers = clone.querySelectorAll('[data-test="challenge-header"]');
	for (let i = 1; i < headers.length; i++) headers[i].remove();
	absolutizeMedia(clone);
	wrap.appendChild(clone);

	const stripEnglishAnswerSlots = (root) => {
		const isEmptySlotTree = (el) => {
			if (el.querySelector('button, img, input, textarea, [data-test="word-bank"], [data-test="challenge-header"], [data-test="challenge-choice"]')) {
				return false;
			}
			if (el.textContent?.trim()) return false;
			if (el.children.length === 0) return true;
			return [...el.children].every((child) => child.tagName === 'DIV' && isEmptySlotTree(child));
		};

		root.querySelectorAll('[data-test="challenge-text-input"]').forEach((el) => el.remove());
		root.querySelectorAll('[data-test$="-challenge-tap-token"]').forEach((el) => {
			if (!el.closest('[data-test="word-bank"]')) el.remove();
		});
		root.querySelectorAll('div').forEach((div) => {
			if (div.closest('[data-test="word-bank"]')) return;
			const kids = [...div.children];
			if (kids.length < 2) return;
			const isLineStack = kids.every((child) => (
				child.tagName === 'DIV'
				&& !child.textContent?.trim()
				&& !child.querySelector('button, img, input, textarea, [data-test]')
			));
			if (isLineStack) div.remove();
		});
		const wb = root.querySelector('[data-test="word-bank"]');
		if (!wb) return;
		const col = wb.parentElement;
		if (col) {
			[...col.children].forEach((child) => {
				if (child === wb) return;
				const keep = child.querySelector(
					'img, picture, [data-test="challenge-header"], [data-test="challenge-choice"], [data-test="challenge-judge-text"]'
				);
				if (!keep && isEmptySlotTree(child)) child.remove();
			});
			const row = col.parentElement;
			if (row) {
				[...row.children].forEach((sibling) => {
					if (sibling === col || sibling.contains(wb)) return;
					if (sibling.querySelector('img, picture, [data-test="challenge-header"], [data-test="challenge-choice"], [data-test="word-bank"]')) return;
					if (isEmptySlotTree(sibling)) sibling.remove();
				});
			}
		}
		root.querySelectorAll('div').forEach((div) => {
			if (div.closest('[data-test="word-bank"]')) return;
			if (isEmptySlotTree(div) && div.children.length <= 1) div.remove();
		});
	};

	const isToEnglish = (document.querySelector('[data-test="challenge-header"]')?.textContent || '')
		.includes('Write this in English');
	if (isToEnglish) {
		stripEnglishAnswerSlots(clone);
	}

	const wordBank = document.querySelector('[data-test="word-bank"]');
	if (wordBank && !container.contains(wordBank)) {
		const wb = wordBank.cloneNode(true);
		sanitize(wb);
		absolutizeMedia(wb);
		if (isToEnglish) stripEnglishAnswerSlots(wrap);
		wrap.appendChild(wb);
	}

	const rootStyle = getComputedStyle(document.documentElement);
	const vars = [];
	for (let i = 0; i < rootStyle.length; i++) {
		const prop = rootStyle[i];
		if (prop.startsWith('--color-') || prop.startsWith('--font-')) {
			vars.push(prop + ': ' + rootStyle.getPropertyValue(prop).trim() + ';');
		}
	}
	const designTokens = vars.length ? ':host { ' + vars.join(' ') + ' }' : '';

	const styleHrefs = [...new Set(
		Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
			.map((l) => l.href)
			.filter((href) => href && isDuoStylesheet(href))
	)];

	return { html: wrap.innerHTML, styleHrefs, designTokens };
}`

func scrapeChallengeMirror(pg *rod.Page) (html string, styleHrefs []string, designTokens string) {
	result, err := pg.Eval(scrapeChallengeMirrorJS)
	if err != nil {
		return "", nil, ""
	}

	m, ok := result.Value.Val().(map[string]interface{})
	if !ok {
		return "", nil, ""
	}

	html, _ = m["html"].(string)
	designTokens, _ = m["designTokens"].(string)
	raw, _ := m["styleHrefs"].([]interface{})
	for _, s := range raw {
		if str, ok := s.(string); ok && str != "" && isAllowedStyleHref(str) {
			styleHrefs = append(styleHrefs, str)
		}
	}
	return html, styleHrefs, designTokens
}

func isAllowedStyleHref(href string) bool {
	lower := strings.ToLower(href)
	return strings.Contains(lower, "cloudfront.net") ||
		strings.Contains(lower, "duolingo") ||
		strings.Contains(lower, "duocdn") ||
		strings.Contains(lower, "d35aaqx5ub95lt") ||
		strings.Contains(lower, "dwzcxfhh6qbm2")
}
