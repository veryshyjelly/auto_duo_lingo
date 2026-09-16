package app

import (
	"log"
	"strings"

	"github.com/go-rod/rod"
)

func GetInfo(do chan interface{}, info chan Challenge, page chan *rod.Page, targetLang string) {
	targetLangHeading := TargetLanguageHeading(targetLang)
	lastAudioPrime := ""

	for {
		<-do
		pg := <-page

		information, err := scrapeChallenge(pg, targetLangHeading)
		if err != nil {
			log.Printf("[SCRAPING] error: %v", err)
			information = Challenge{
				Type:  Nothing,
				Error: err.Error(),
			}
		}

		if information.HasAudio && len(information.AudioUrls) == 0 {
			key := information.Title + "|" + information.Prompt
			if key != lastAudioPrime {
				if urls := primeAudio(pg); len(urls) > 0 {
					information.AudioUrls = urls
				}
				lastAudioPrime = key
			}
		} else if information.HasAudio && len(information.AudioUrls) > 0 {
			// Re-rank: drop word-level /token/ URLs when a better sentence URL exists.
			information.AudioUrls = pickBestAudioUrls(information.AudioUrls)
			if len(information.AudioUrls) > 0 && strings.Contains(strings.ToLower(information.AudioUrls[0]), "/token/") {
				key := information.Title + "|" + information.Prompt
				if key != lastAudioPrime {
					if urls := primeAudio(pg); len(urls) > 0 && !strings.Contains(strings.ToLower(urls[0]), "/token/") {
						information.AudioUrls = urls
					}
					lastAudioPrime = key
				}
			}
		}

		page <- pg
		info <- information
	}
}

func scrapeChallenge(pg *rod.Page, targetLangHeading string) (Challenge, error) {
	heading, err := evalString(pg, `() => document.querySelector('[data-test="challenge-header"]')?.innerText || document.querySelector("h1")?.innerText || document.querySelector("h2")?.innerText || ''`)
	if err != nil {
		return Challenge{}, err
	}

	progress, err := evalInt(pg, `() => Math.min(Math.ceil((document.querySelector('[role="progressbar"]')?.ariaValueNow || 0) * 100), 100)`)
	if err != nil {
		progress = 0
	}

	rightAnswer, _ := evalString(pg, `() => {
		const blame = document.querySelector('[data-test="blame blame-incorrect"]');
		if (!blame) return '';
		const solution = blame.querySelector('[data-test="blame-solution"]')
			|| blame.querySelector('[dir="ltr"]')
			|| blame;
		const clone = solution.cloneNode(true);
		clone.querySelectorAll('rt').forEach((rt) => rt.remove());
		return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
	}`)

	prompt, _ := evalString(pg, scrapePromptJS())

	options, _ := evalStringArray(pg, `() => Array.prototype.slice.call(document.querySelectorAll(' \
		[data-test="challenge-judge-text"], \
		[data-test="challenge-tap-token-text"], \
		[data-test="challenge-choice"] [dir="ltr"] \
	')).filter(x => x.innerText).map(x => x.innerText)`)

	optionImages := scrapeOptionImages(pg, len(options))

	information := Challenge{
		Type:         DetectChallengeType(heading, targetLangHeading),
		Progress:     progress,
		Title:        heading,
		Prompt:       prompt,
		Options:      options,
		OptionImages: optionImages,
		RightAnswer:  rightAnswer,
	}

	if isTapTokenFillChallenge(pg, heading) {
		information.Prompt = scrapeTapTokenPrompt(pg)
		information.Options = scrapeWordBankOptions(pg)
	}

	if isDialogueChallenge(pg, heading) {
		information.Type = ChooseOption
		information.Prompt = scrapeDialoguePrompt(pg)
		information.Options = scrapeDialogueOptions(pg)
	}

	if information.Type == ToEnglish {
		information.Options = scrapeWordBankOptions(pg)
	}

	audioUrls, hasAudio := scrapeAudio(pg)
	information.AudioUrls = audioUrls
	information.HasAudio = hasAudio

	if isListenTapChallenge(pg, heading) {
		information.Type = ToJapanese
		information.Options = nil
		information.HasAudio = true
		ph, lang := scrapeTranslateInput(pg)
		information.InputPlaceholder = ph
		information.InputLang = lang
	} else if information.Type == ToJapanese {
		ph, lang := scrapeTranslateInput(pg)
		information.InputPlaceholder = ph
		information.InputLang = lang
	}

	if information.Type == Matching {
		activePrompt, _ := evalString(pg, `() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-tap-token-text"]')).find(x => document.querySelector('[data-test="' + x.innerText + '-challenge-tap-token"]')?.ariaDisabled == 'false')?.innerText || ''`)
		if activePrompt != "" {
			information.Prompt = activePrompt
		}
		if len(options) > 1 {
			information.Options = options[len(options)/2:]
			information.OptionImages = scrapeOptionImages(pg, len(information.Options))
		}
	}

	if information.Prompt == "" {
		information.Prompt = information.Title
	}

	if information.Type != Nothing {
		information.ChallengeHTML, information.StyleHrefs, information.DesignTokens = scrapeChallengeMirror(pg)
	}

	return information, nil
}

func scrapePromptJS() string {
	return `() => {
		const selectors = [
			'[data-test="challenge challenge-characterIntro"] h1',
			'[data-test="challenge challenge-assist"] [data-test="challenge-prompt"]',
			'[data-test="challenge challenge-characterMatch"] h1',
			'[data-test="challenge challenge-gapFill"] [dir="ltr"]',
			'[data-test="challenge challenge-assist"] [dir="ltr"]',
			'[data-test="challenge challenge-translate"] [dir="ltr"]',
			'[data-test="challenge challenge-characterIntro"] [dir="ltr"]',
		];
		for (const sel of selectors) {
			const el = document.querySelector(sel);
			if (el?.innerText?.trim()) return el.innerText.trim().replace(/\n/g, ' ');
		}
		return '';
	}`
}

func scrapeOptionImages(pg *rod.Page, optionCount int) []string {
	if optionCount == 0 {
		return nil
	}
	images, _ := evalStringArray(pg, `() => {
		const choices = document.querySelectorAll('[data-test="challenge-choice"]');
		if (choices.length) {
			return Array.from(choices).map(c => c.querySelector('img')?.src || '');
		}
		return [];
	}`)
	if len(images) == 0 {
		return nil
	}
	// Pad or trim to match option count
	out := make([]string, optionCount)
	for i := 0; i < optionCount; i++ {
		if i < len(images) {
			out[i] = images[i]
		}
	}
	return out
}

func isListenTapChallenge(pg *rod.Page, heading string) bool {
	if strings.Contains(heading, "Type what you hear") {
		return true
	}
	has, _ := evalBool(pg, `() => !!document.querySelector('[data-test="challenge challenge-listenTap"]')`)
	return has
}

func scrapeTranslateInput(pg *rod.Page) (placeholder string, lang string) {
	placeholder, _ = evalString(pg, `() => document.querySelector('[data-test="challenge-translate-input"]')?.placeholder || ''`)
	lang, _ = evalString(pg, `() => document.querySelector('[data-test="challenge-translate-input"]')?.lang || ''`)
	return placeholder, lang
}

func isTapTokenFillChallenge(pg *rod.Page, heading string) bool {
	if strings.Contains(heading, "Select the missing word") || strings.Contains(heading, "missing word") {
		return true
	}
	if strings.Contains(heading, "Fill in the blank") {
		has, _ := evalBool(pg, `() => !!document.querySelector('[data-test="word-bank"], [data-test="challenge challenge-tapComplete"]')`)
		return has
	}
	has, _ := evalBool(pg, `() => !!document.querySelector('[data-test="challenge challenge-tapComplete"]')`)
	return has
}

func scrapeTapTokenPrompt(pg *rod.Page) string {
	prompt, _ := evalString(pg, `() => {
		const gapClasses = ['_3sKWR', '_17wB6'];

		const build = (root) => {
			if (!root) return '';
			const parts = [];
			const seen = new Set();
			const isGap = (node) => {
				if (gapClasses.some(c => node.classList?.contains(c))) return true;
				return node.parentElement === root
					&& node.querySelector?.('[data-test$="-challenge-tap-token"]')
					&& !node.querySelector?.('[data-test="hint-token"]');
			};
			const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
			let node;
			while (node = walker.nextNode()) {
				if (isGap(node)) {
					parts.push(' ___ ');
					continue;
				}
				if (node.getAttribute('data-test') !== 'hint-token' || seen.has(node)) {
					continue;
				}
				seen.add(node);
				const label = node.getAttribute('aria-label');
				if (label) parts.push(label);
			}
			return parts.join('');
		};

		const table = document.querySelector('table tbody');
		if (table) {
			return Array.from(table.querySelectorAll('tr'))
				.map(row => build(row.querySelector('td') || row))
				.filter(Boolean)
				.join('\n');
		}

		const tapComplete = document.querySelector('[data-test="challenge challenge-tapComplete"] [dir="ltr"]')
			|| document.querySelector('[data-test="challenge challenge-tapComplete"]');
		if (tapComplete) {
			return build(tapComplete);
		}

		return '';
	}`)
	return prompt
}

func scrapeWordBankOptions(pg *rod.Page) []string {
	options, _ := evalStringArray(pg, `() => Array.from(
		document.querySelectorAll('[data-test="word-bank"] [data-test="challenge-tap-token-text"]')
	).map(x => x.innerText).filter(Boolean)`)
	return options
}

func isDialogueChallenge(pg *rod.Page, heading string) bool {
	if strings.Contains(heading, "Complete the chat") {
		return true
	}
	has, _ := evalBool(pg, `() => !!document.querySelector('[data-test="challenge challenge-dialogue"]')`)
	return has
}

func scrapeDialoguePrompt(pg *rod.Page) string {
	prompt, _ := evalString(pg, `() => {
		const root = document.querySelector('[data-test="challenge challenge-dialogue"]');
		if (!root) return '';

		return Array.from(root.querySelectorAll('._20npu')).map(bubble => {
			const speaker = bubble.querySelector('._2n6in')?.textContent?.trim() || '';
			const parts = [];
			if (speaker) parts.push(speaker);

			if (bubble.querySelector('._3AISd')) {
				parts.push('___');
				return parts.join(' ');
			}

			const seen = new Set();
			const text = [];
			bubble.querySelectorAll('[data-test="hint-token"]').forEach(token => {
				if (seen.has(token)) return;
				seen.add(token);
				const label = token.getAttribute('aria-label');
				if (label) text.push(label);
			});
			parts.push(text.join(''));
			return parts.join(' ');
		}).filter(Boolean).join('\n');
	}`)
	return prompt
}

func scrapeDialogueOptions(pg *rod.Page) []string {
	options, _ := evalStringArray(pg, `() => Array.from(
		document.querySelectorAll('[data-test="challenge challenge-dialogue"] [data-test="challenge-judge-text"]')
	).map(x => x.innerText.trim()).filter(Boolean)`)
	return options
}

func evalString(pg *rod.Page, js string) (string, error) {
	result, err := pg.Eval(js)
	if err != nil {
		return "", err
	}
	return result.Value.Str(), nil
}

func evalInt(pg *rod.Page, js string) (int, error) {
	result, err := pg.Eval(js)
	if err != nil {
		return 0, err
	}
	return result.Value.Int(), nil
}

func evalStringArray(pg *rod.Page, js string) ([]string, error) {
	result, err := pg.Eval(js)
	if err != nil {
		return nil, err
	}

	raw, ok := result.Value.Val().([]interface{})
	if !ok {
		return []string{}, nil
	}

	out := make([]string, 0, len(raw))
	for _, item := range raw {
		if s, ok := item.(string); ok {
			out = append(out, s)
		}
	}
	return out, nil
}

func evalBool(pg *rod.Page, js string) (bool, error) {
	result, err := pg.Eval(js)
	if err != nil {
		return false, err
	}
	return result.Value.Bool(), nil
}
