package app

import (
	"fmt"
	"github.com/go-rod/rod"
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
	ENGLISH
	JAPANESE
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
		switch a.Type {
		case START:
			pg := <-page
			page <- pg.MustNavigate("https://www.duolingo.com/lesson")
		case CONTINUE:
			pg := <-page
			pg.MustElement("#session\\/PlayerFooter > div > div > button").MustClick()
			AutoContinue(pg)
			page <- pg
		case MATCH:
			option := a.OptionValue
			pg := <-page
			els := pg.MustElements("._231NG")
			for _, e := range els {
				if e.MustText() == option {
					e.MustClick()
					break
				}
			}
			AutoContinue(pg)
			page <- pg
		case SOUND:
		case FillInBlank:
			option := a.OptionValue
			pg := <-page
			els := pg.MustElements(".CwCwj")
			for _, e := range els {
				if e.MustText() == option {
					e.MustClick()
					break
				}
			}
			AutoContinue(pg)
			page <- pg
		case CHARACTER:
			option := a.OptionValue
			pg := <-page
			els := pg.MustElements(".APqdQ")
			for _, e := range els {
				if e.MustText() == option {
					e.MustClick()
					break
				}
			}
			AutoContinue(pg)
			page <- pg
		case ENGLISH:
			text := a.EnglishChips
			pg := <-page
			chips := pg.MustElementsByJS(`() => document.querySelector(".eSgkc").children`)
			for _, t := range text {
				for _, chip := range chips {
					btn := chip.MustElement("button")
					if btn.MustProperty("ariaDisabled").Bool() {
						continue
					}
					if strings.ToUpper(btn.MustText()) == strings.ToUpper(t) {
						btn.MustClick()
					}
				}
			}
			AutoContinue(pg)
			page <- pg
		case JAPANESE:
			text := a.JapaneseTranslate
			pg := <-page
			fmt.Printf("Writing: %v", text)
			inputBox := pg.MustElement("._2OQj6")
			inputBox.MustFocus()
			pg.MustInsertText(text)
			AutoContinue(pg)
			page <- pg
		default:
			log.Printf("Invalid Action %v\n", action)
			continue
		}
		doneAction <- true
	}
}

func AutoContinue(page *rod.Page) {
	for {
		ele, err := page.Timeout(time.Millisecond * 1000).Element("._2oGJR")
		if ele == nil {
			ele, err = page.Timeout(time.Millisecond * 1000).Element("._1lyVV")
		}
		if err != nil || ele == nil {
			return
		}
		fmt.Println("aria-disabled: ", ele.MustProperty("ariaDisabled"))
		if ele.MustProperty("ariaDisabled").Str() == "true" {
			return
		}
		ele.MustClick()
		page.MustWaitLoad()
	}
}
