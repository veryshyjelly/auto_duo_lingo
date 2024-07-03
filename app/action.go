package app

import (
	"fmt"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"log"
	"strings"
	"time"
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
			AutoContinue(pg)
			page <- pg
		case CONTINUE:
			pg.Keyboard.Type(input.Enter)
			AutoContinue(pg)
			page <- pg
		case MATCH:
			clickOption(pg, a.OptionValue, "._231NG")
			AutoContinue(pg)
			page <- pg
		case SOUND:
			clickOption(pg, a.OptionValue, ".lEvgJ")
			AutoContinue(pg)
			page <- pg
		case FillInBlank:
			clickOption(pg, a.OptionValue, ".lEvgJ")
			AutoContinue(pg)
			page <- pg
		case WhichOne:
			clickOption(pg, a.OptionValue, "._1NM0v")
			AutoContinue(pg)
			page <- pg
		case CHARACTER:
			clickOption(pg, a.OptionValue, ".APqdQ")
			AutoContinue(pg)
			page <- pg
		case ENGLISH:
			text := a.EnglishChips
			chips := pg.MustElementsByJS(`() => document.querySelector(".eSgkc").children`)
			for _, t := range text {
				for _, chip := range chips {
					btn := chip.MustElement("button")
					if btn.MustProperty("ariaDisabled").Str() == "true" {
						continue
					}
					if strings.ToUpper(btn.MustText()) == strings.ToUpper(t) {
						btn.MustClick()
						break
					}
				}
			}
			AutoContinue(pg)
			page <- pg
		case JAPANESE:
			text := a.JapaneseTranslate
			fmt.Printf("Writing: %v", text)
			inputBox := pg.MustElement("._2OQj6")
			inputBox.MustFocus()
			pg.MustInsertText(text)
			AutoContinue(pg)
			page <- pg
		case PLAY:
			pg.Keyboard.Press(input.ControlLeft)
			pg.Keyboard.Press(input.Space)
			pg.Keyboard.Release(input.Space)
			pg.Keyboard.Release(input.ControlLeft)
			page <- pg
		default:
			page <- pg
			log.Printf("Invalid Action %v\n", action)
			continue
		}
		doneAction <- true
	}
}

func clickOption(pg *rod.Page, opt string, selector string) {
	els := pg.MustElements(selector)
	for _, e := range els {
		if e.MustText() == opt {
			e.MustClick()
			break
		}
	}
}

func AutoContinue(page *rod.Page) {
	for {
		ele, err := page.Timeout(time.Millisecond * 500).Element("._2oGJR")
		//if ele == nil {
		//	ele, err = page.Timeout(time.Millisecond * 500).Element("._1lyVV")
		//}
		if err != nil || ele == nil {
			return
		}
		fmt.Println("aria-disabled: ", ele.MustProperty("ariaDisabled"))
		if ele.MustProperty("ariaDisabled").Str() == "true" {
			return
		}
		page.Keyboard.Type(input.Enter)
		//_ = ele.Click(proto.InputMouseButtonLeft, 1)
		page.MustWaitLoad()
	}
}
