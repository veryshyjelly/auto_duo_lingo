package app

import (
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"log"
)

type Action uint8

const (
	START Action = iota
	CONTINUE
	SOUND
	MATCH
	CHARACTER
	FillInBlank
	WhichOne
	ENGLISH
	JAPANESE
	PLAY
)

type ActionData struct {
	Type              Action   `json:"type"`
	OptionValue       string   `json:"optionValue"`
	EnglishChips      []string `json:"englishChips"`
	JapaneseTranslate string   `json:"japaneseTranslate"`
}

func HandleAction(action chan ActionData, page chan *rod.Page, doneAction chan bool) {
	for {
		a := <-action
		pg := <-page
		switch a.Type {
		case START:
			// If already started a lesson then we should try to continue 🫡
			if pg.MustInfo().URL == "https://www.duolingo.com/lesson" {
				log.Println("Clicking next button ✅")
				pg.MustEval(`() => document.querySelector('[data-test="player-next"]')?.click()`)
			} else {
				log.Println("Starting new lesson 🏫")
				pg.MustNavigate("https://www.duolingo.com/lesson")
			}
		case MATCH:
			// No filtering required 🤌 directly click the button using data field
			log.Printf("Matching option 🤹‍♀️: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => document.querySelector('[data-test="' + txt + '-challenge-tap-token"]')?.click()`, a.OptionValue)
		case SOUND:
			log.Printf("Chossing sound 🔉: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-judge-text"]')).find(x => x.innerText == txt)?.click()`, a.OptionValue)
		case FillInBlank:
			//clickOption(pg, a.OptionValue, ".lEvgJ")
		case WhichOne:
			//clickOption(pg, a.OptionValue, "._1NM0v")
		case CHARACTER:
			// First child 👶 has the text we want to compare
			log.Printf("Choosing character 💌: %v\n", a.OptionValue)
			pg.MustEval(`(txt) => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-choice"]')).find(x => x.firstChild.innerText == txt)?.click()`, a.OptionValue)
		case ENGLISH:
			// Javascript that will click👆 the words in O(n) total time complexity🚅
			log.Printf("Clicking english chips 🍟: %v\n", a.EnglishChips)
			pg.MustEval(`(words) => {
				for (let i = 0; i < words.length; i++) {
				    let word = words[i];
				    document.querySelector('[data-test="word-bank"] [data-test="' + word + '-challenge-tap-token"][aria-disabled="false"]')?.click();
				}
			}`, a.EnglishChips)
		case JAPANESE:
			// Put focus on the input then paste the text 💬
			log.Printf("Inserting Japanese text 💬: %v\n", a.JapaneseTranslate)
			pg.MustElementByJS(`() => document.querySelector('[data-test="challenge-translate-input"]')`).MustFocus()
			pg.MustInsertText(a.JapaneseTranslate)
		case PLAY:
			pg.Keyboard.Press(input.ControlLeft)
			pg.Keyboard.Press(input.Space)
			pg.Keyboard.Release(input.Space)
			pg.Keyboard.Release(input.ControlLeft)
		case CONTINUE:
			log.Println("Clicking next button ✅")
			pg.MustEval(`() => document.querySelector('[data-test="player-next"]')?.click()`)
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
		if page.MustEval(`() => document.querySelector('[data-test="player-next"]') == null`).Bool() {
			log.Println("Button not found 🙈")
			return
		}
		// If the answer is incorrect ❌ then return
		if !page.MustEval(`() => document.querySelector('[data-test="blame blame-incorrect"]') == null`).Bool() {
			log.Println("Incorrect was your answer ❌")
			return
		}
		// If the button is disabled ♿ then also return
		if page.MustEval(`() => document.querySelector('[data-test="player-next"]')?.ariaDisabled == 'true'`).Bool() {
			log.Println("Button was disabled ♿")
			return
		}
		// Click on the next button ✅
		log.Println("Clicking next button ✅")
		page.MustEval(`() => document.querySelector('[data-test="player-next"]')?.click()`)
	}
}
