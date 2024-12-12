package app

import (
	"log"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
)

func HandleAction(action chan ActionData, page chan *rod.Page, doneAction chan interface{}) {
	for {
		a := <-action
		pg := <-page
		switch a.Type {
		case START:
			// If already started a lesson then we should try to continue 🫡
			if pg.MustInfo().URL == "https://www.duolingo.com/lesson" {
				log.Println("Clicking next button ✅")
				pg.MustEval(`() => document.querySelector('[data-test=player-next]')?.click()`)
			} else {
				log.Println("Starting new lesson 🏫")
				pg.MustNavigate("https://www.duolingo.com/lesson")
			}
		case MATCH:
			// No filtering required 🤌 directly click the button using data field
			log.Printf("Matching option 🤹‍♀️: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => document.querySelector('[data-test="' + txt + '-challenge-tap-token"]')?.click()`, a.OptionValue)
		case CHOOSE:
			log.Printf("Choosing option 🎡: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => Array.prototype.slice.call(document.querySelectorAll('[data-test=challenge-judge-text], [data-test=challenge-choice] [dir=ltr]')).find(x => x.innerText == txt)?.click()`, a.OptionValue)
		case ENGLISH:
			// Javascript that will click👆 the words in O(n) total time complexity🚅
			log.Printf("Clicking english chips 🍟: %v\n", a.EnglishChips)
			pg.MustEval(`(words) => {
				for (let i = 0; i < words?.length; i++) {
				    let word = words[i];
				    document.querySelector('[data-test=word-bank] [data-test="' + word + '-challenge-tap-token"][aria-disabled=false]')?.click();
				}
			}`, a.EnglishChips)
		case JAPANESE:
			// Put focus on the input then paste the text 💬
			log.Printf("Inserting Japanese text 💬: %v\n", a.JapaneseTranslate)
			pg.MustEval(`() => document.querySelector('[data-test=challenge-translate-input]')?.focus()`)
			pg.MustInsertText(a.JapaneseTranslate)
		case PLAY:
			_ = pg.Keyboard.Press(input.ControlLeft)
			_ = pg.Keyboard.Press(input.Space)
			_ = pg.Keyboard.Release(input.Space)
			_ = pg.Keyboard.Release(input.ControlLeft)
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
	// Robust Auto-continue function
	for {
		page.MustWaitLoad()
		// If the button does not exist then what to click? Just return
		if page.MustEval(`() => document.querySelector('[data-test=player-next]') == null`).Bool() {
			log.Println("Button not found 🙈")
			return
		}
		// If the answer is incorrect ❌ then return
		if !page.MustEval(`() => document.querySelector('[data-test="blame blame-incorrect"]') == null`).Bool() {
			log.Println("Incorrect was your answer ❌")
			return
		}
		// If the button is disabled ♿ then also return
		if page.MustEval(`() => document.querySelector('[data-test=player-next]')?.ariaDisabled == 'true'`).Bool() {
			log.Println("Button was disabled ♿")
			return
		}
		// Click on the next button ✅
		log.Println("Clicking next button ✅")
		page.MustEval(`() => document.querySelector('[data-test=player-next]')?.click()`)
	}
}
