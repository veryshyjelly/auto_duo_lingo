package app

import (
	"github.com/go-rod/rod"
	"strings"
)

func GetInfo(do chan interface{}, info chan Challenge, page chan *rod.Page) {
	for {
		<-do
		pg := <-page

		heading := pg.MustElementByJS(`() => document.querySelector("h1") || document.querySelector("h2")`).MustText()
		progress := pg.MustEval(`() => Math.min(Math.ceil(document.querySelector('[role="progressbar"]')?.ariaValueNow * 100), 100)`).Int()
		rightAnswer := pg.MustEval(`() => document.querySelector(
						'[data-test="blame blame-incorrect"]'
					)?.querySelector('[dir="ltr"]')?.innerText || ''`).Str()
		prompt := pg.MustEval(`() => document.querySelector(' \
						[data-test="challenge challenge-characterIntro"] [dir="ltr"], \
						[data-test="challenge challenge-gapFill"] [dir="ltr"], \
						[data-test="challenge challenge-assist"] [dir="ltr"], \
						[data-test="challenge challenge-translate"] [dir="ltr"] \
					')?.innerText?.replace('\n', '_____') || ''`).Str()
		options := pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll(' \
						[data-test="challenge-judge-text"], \
						[data-test="challenge-tap-token-text"], \
						[data-test="challenge-choice"] [dir="ltr"] \
					'))?.filter(x => x.innerText)?.map(x => x.innerText) || []`).Val().([]interface{})

		information := Challenge{
			Type:        Nothing,
			Progress:    progress,
			Title:       heading,
			Prompt:      prompt,
			RightAnswer: rightAnswer,
		}

		if strings.Contains(heading, "What sound does this make") ||
			strings.Contains(heading, "Select the correct") ||
			strings.Contains(heading, "Fill in the blank") ||
			strings.Contains(heading, "Read and respond") ||
			strings.Contains(heading, "Which one of these is") {
			information.Options = options[:min(len(options), 4)]
			information.Type = ChooseOption
		} else if strings.Contains(heading, "Tap the matching pairs") || strings.Contains(heading, "Select the matching pairs") {
			information.Type = Matching
			// We need to do this extra stuff for more efficiency 🙂
			information.Prompt = pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-tap-token-text"]')).find(x => document.querySelector('[data-test="' + x.innerText + '-challenge-tap-token"]').ariaDisabled == 'false')?.innerText || ''`).Str()
			information.Options = options[min(len(options)/2, 10):min(10, len(options))]
		} else if strings.Contains(heading, "Write this in English") {
			information.Options = options
			information.Type = ToEnglish
		} else if strings.Contains(heading, "Write this in Japanese") {
			information.Type = ToJapanese
		}

		page <- pg
		info <- information
	}
}
