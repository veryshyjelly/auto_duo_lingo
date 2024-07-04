package app

import (
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
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
	// So we will pass the text of the option in the data for selecting option
	// And pass the english or japanese text respectively for it
	for {
		a := <-action
		pg := <-page
		switch a.Type {
		case START:
			pg.MustNavigate("https://www.duolingo.com/lesson")
		case MATCH:
			pg.MustEval(`(txt) => document.querySelector('button[data-test="' + txt + '-challenge-tap-token"]')?.click()`, a.OptionValue)
		case SOUND:
			pg.MustEval(`(txt) => Array.prototype.slice.call(document.querySelectorAll('span[data-test="challenge-judge-text"]')).find(x => x.innerText == txt)?.click()`, a.OptionValue)
		case FillInBlank:
			//clickOption(pg, a.OptionValue, ".lEvgJ")
		case WhichOne:
			//clickOption(pg, a.OptionValue, "._1NM0v")
		case CHARACTER:
			pg.MustEval(`(txt) => Array.prototype.slice.call(document.querySelectorAll('div[data-test="challenge-choice"]')).find(x => x.firstChild.innerText == txt)?.click()`, a.OptionValue)
		case ENGLISH:
			pg.MustEval(`(words) => {
					for (let i = 0; i < words.length; i++) {
				    let word = words[i];
				    Array.prototype.slice.call(document.querySelectorAll('button[data-test="' + word + '-challenge-tap-token"]')).find(x => x.ariaDisabled == 'false')?.click();
				}
			}`, a.EnglishChips)
		case JAPANESE:
			inputBox := pg.MustElement("._2OQj6")
			inputBox.MustFocus()
			pg.MustInsertText(a.JapaneseTranslate)
		case PLAY:
			pg.Keyboard.Press(input.ControlLeft)
			pg.Keyboard.Press(input.Space)
			pg.Keyboard.Release(input.Space)
			pg.Keyboard.Release(input.ControlLeft)
		case CONTINUE:
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
		if page.MustEval(`() => document.querySelector('button[data-test="player-next"]') == null`).Bool() {
			return
		}
		// If the answer is incorrect then return
		if !page.MustEval(`() => document.querySelector('div[data-test="blame blame-incorrect"]') == null`).Bool() {
			return
		}
		// If the button is disabled then also return
		if page.MustEval(`() => document.querySelector('button[data-test="player-next"]')?.ariaDisabled == 'true'`).Bool() {
			return
		}
		// Click on the next button
		page.MustEval(`() => document.querySelector('button[data-test="player-next"]')?.click()`)
	}
}
