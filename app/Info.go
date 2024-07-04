package app

import (
	"github.com/go-rod/rod"
	"strings"
)

func GetInfo(do chan bool, info chan Challenge, page chan *rod.Page) {
	for {
		_ = <-do
		pg := <-page
		pg.MustWaitLoad()
		heading := pg.MustElement("h1").MustText()
		erra, _ := pg.Eval(`() => document.querySelector('div[data-test="blame blame-incorrect"]').querySelector('div[dir="ltr"]').innerText`)
		var rightAnswer string
		if erra != nil {
			rightAnswer = erra.Value.Str()
		}
		options := make([]string, 0)

		if strings.Contains(heading, "What sound does this make") {
			prompt := pg.MustEval("() => document.querySelector('._25SW8').innerText").Str()
			options = append([]string{})
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('span[data-test="challenge-judge-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        GuessSound,
				Title:       heading,
				Prompt:      prompt,
				Options:     options[:min(len(options), 4)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Select the correct character") {
			options = append([]string{})
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('div[data-test="challenge-choice"]')).map(x => x.firstChild.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        SelectCharacter,
				Title:       heading,
				Prompt:      "",
				Options:     options[:min(len(options), 4)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Tap the matching pairs") || strings.Contains(heading, "Select the matching pairs") {
			options = append([]string{})
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('span[data-test="challenge-tap-token-text"]')).filter(x => document.querySelector('button[data-test="' + x.innerText + '-challenge-tap-token"]').ariaDisabled == 'false').map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        Matching,
				Title:       heading,
				Prompt:      "",
				Options:     options[:min(len(options), 10)],
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Fill in the blank") {
			prompt := pg.MustEval("() => Array.prototype.slice.call(document.querySelector('._3gSoe').children[0].children).map(x => x.className == '_5HFLU' ? x.innerText : '_______').join('')").Str()
			options = append([]string{})
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('.lEvgJ')).map(x => x.innerText)").Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Which one of these is") {
			options = append([]string{})
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('._1NM0v')).map(x => x.innerText)").Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        WhichOneOfThese,
				Title:       heading,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Select the correct meaning") {
			prompt := pg.MustEval("() => document.querySelector('._2L10X').innerText").Str()
			options = append([]string{})
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('.lEvgJ')).map(x => x.innerText)").Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        GuessSound,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Read and respond") {
			prompt := pg.MustEval("() => document.querySelector('._5HFLU').innerText").Str()
			options = append([]string{})
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('.lEvgJ')).map(x => x.innerText)").Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        FillInTheBlank,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Write this in English") {
			prompt := pg.MustEval("() => document.querySelector('._5HFLU').innerText").Str()
			options = append([]string{})
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll('div[data-test="word-bank"] span[data-test="challenge-tap-token-text"]')).map(x => x.innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        ToEnglish,
				Title:       heading,
				Prompt:      prompt,
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Write this in Japanese") {
			prompt := pg.MustEval("() => document.querySelector('._5HFLU').innerText").Str()
			info <- Challenge{
				Type:        ToJapanese,
				Title:       heading,
				Prompt:      prompt,
				Options:     nil,
				RightAnswer: rightAnswer,
			}
		} else {
			info <- Challenge{Type: Nothing}
		}
		page <- pg
	}
}
