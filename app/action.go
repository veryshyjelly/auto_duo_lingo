package app

import (
	"log"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
)

func HandleAction(action chan ActionData, page chan *rod.Page, doneAction chan interface{}, lessonURL string) {
	for {
		a := <-action
		pg := <-page
		switch a.Type {
		case START:
			if pg.MustInfo().URL == lessonURL {
				log.Println("Clicking next button ✅")
				pg.MustEval(`() => document.querySelector('[data-test=player-next]')?.click()`)
			}
			log.Println("Starting new lesson 🏫")
			pg.MustNavigate(lessonURL)
		case MATCH:
			log.Printf("Matching option 🤹‍♀️: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => document.querySelector('[data-test="' + txt + '-challenge-tap-token"]')?.click()`, a.OptionValue)
		case CHOOSE:
			log.Printf("Choosing option 🎡: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => {
				let el = Array.prototype.slice.call(document.querySelectorAll('[data-test=challenge-judge-text], [data-test=challenge-choice] [dir=ltr]')).find(x => x.innerText == txt);
				if (el) { el.click(); return; }
				document.querySelector('[data-test=word-bank] [data-test="' + txt + '-challenge-tap-token"][aria-disabled=false]')?.click();
			}`, a.OptionValue)
		case ENGLISH:
			log.Printf("Clicking english chips 🍟: %v\n", a.EnglishChips)
			pg.MustEval(`(words) => {
				for (let i = 0; i < words?.length; i++) {
				    let word = words[i];
				    document.querySelector('[data-test=word-bank] [data-test="' + word + '-challenge-tap-token"][aria-disabled=false]')?.click();
				}
			}`, a.EnglishChips)
		case JAPANESE:
			log.Printf("Inserting target-language text 💬: %v\n", a.JapaneseTranslate)
			pg.MustEval(`() => document.querySelector('[data-test=challenge-translate-input]')?.focus()`)
			pg.MustInsertText(a.JapaneseTranslate)
		case PLAY:
			log.Println("Playing challenge audio 🔊")
			clicked := pg.MustEval(`() => {
				const selectors = [
					'[data-test="challenge-speaker"]',
					'[data-test="speaker"]',
					'[data-test="challenge-listen"]',
					'[data-test^="challenge challenge-"] button:has(.animated-speaker-icon-lottie)',
					'[data-test^="challenge challenge-"] button:has(svg)',
					'button[aria-label*="Listen" i]',
					'button[aria-label*="Play" i]',
				];
				for (const sel of selectors) {
					try {
						const btn = document.querySelector(sel);
						if (btn) { btn.click(); return true; }
					} catch (_) {}
				}
				return false;
			}`).Bool()
			if !clicked {
				_ = pg.Keyboard.Press(input.ControlLeft)
				_ = pg.Keyboard.Press(input.Space)
				_ = pg.Keyboard.Release(input.Space)
				_ = pg.Keyboard.Release(input.ControlLeft)
			}
		case CONTINUE:
			log.Println("Clicking next button ✅")
			pg.MustEval(`() => document.querySelector('[data-test=player-next]')?.click()`)
		}
		AutoContinue(pg)
		page <- pg
		doneAction <- true
	}
}

func AutoContinue(page *rod.Page) {
	for {
		page.MustWaitLoad()
		if page.MustEval(`() => document.querySelector('[data-test=player-next]') == null`).Bool() {
			log.Println("Button not found 🙈")
			return
		}
		if !page.MustEval(`() => document.querySelector('[data-test="blame blame-incorrect"]') == null`).Bool() {
			log.Println("Incorrect was your answer ❌")
			return
		}
		if page.MustEval(`() => document.querySelector('[data-test=player-next]')?.ariaDisabled == 'true'`).Bool() {
			log.Println("Button was disabled ♿")
			return
		}
		log.Println("Clicking next button ✅")
		page.MustEval(`() => document.querySelector('[data-test=player-next]')?.click()`)
	}
}
