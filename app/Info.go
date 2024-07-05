package app

import (
	"github.com/go-rod/rod"
	"strings"
)

func GetInfo(do chan bool, info chan Challenge, pg *rod.Page) {
	for {
		_ = <-do
		pg.MustWaitLoad()
		heading := pg.MustElementByJS(`() => document.querySelector("h1") || document.querySelector("h2")`).MustText()
		erra, _ := pg.Eval(`() => document.querySelector('[data-test="blame blame-incorrect"]')?.querySelector('[dir="ltr"]')?.innerText`)
		var rightAnswer string
		if erra != nil {
			rightAnswer = erra.Value.Str()
		}
		options := make([]string, 0)
		progress := pg.MustEval(`() => Math.min(Math.ceil(document.querySelector('[role="progressbar"]')?.ariaValueNow * 100), 100)`).Int()

		if strings.Contains(heading, "What sound does this make") {
			prompt := pg.MustEval(`() => document.querySelector('[data-test="challenge challenge-characterIntro"] [dir="ltr"]').innerText`).Str()
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-judge-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     options[:min(len(options), 4)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Fill in the blank") {
			prompt := pg.MustEval(`() => document.querySelector('[data-test="challenge challenge-gapFill"] [dir="ltr"]').innerText.replace('\n', '_____')`).Str()
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-judge-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Select the correct meaning") {
			prompt := pg.MustEval(`() => document.querySelector('[data-test="challenge challenge-assist"] [dir="ltr"]').innerText`).Str()
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-judge-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Read and respond") {
			// TODO remove the class name
			prompt := pg.MustEval("() => document.querySelector('._5HFLU').innerText").Str()
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-judge-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Select the correct character") || strings.Contains(heading, "Which one of these is") {
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-choice"] [dir="ltr"]')).filter(x => x.innerText).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        SelectCharacter,
				Progress:    progress,
				Title:       heading,
				Prompt:      "",
				Options:     options[:min(len(options), 4)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Tap the matching pairs") || strings.Contains(heading, "Select the matching pairs") {
			options = append([]string{})
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="challenge-tap-token-text"]')).filter(x => document.querySelector('[data-test="' + x.innerText + '-challenge-tap-token"]').ariaDisabled == 'false').map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        Matching,
				Progress:    progress,
				Title:       heading,
				Prompt:      "",
				Options:     options[:min(len(options), 10)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Write this in English") {
			prompt := pg.MustEval(`() => document.querySelector('[data-test="challenge challenge-translate"] [dir="ltr"]').innerText`).Str()
			options = []string{}
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('[data-test="word-bank"] [data-test="challenge-tap-token-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        ToEnglish,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Write this in Japanese") {
			prompt := pg.MustEval(`() => document.querySelector('[data-test="challenge challenge-translate"] [dir="ltr"]').innerText`).Str()
			info <- Challenge{
				Type:        ToJapanese,
				Progress:    progress,
				Title:       heading,
				Prompt:      prompt,
				Options:     nil,
				RightAnswer: rightAnswer,
			}
		} else {
			info <- Challenge{Type: Nothing}
		}
	}
}
