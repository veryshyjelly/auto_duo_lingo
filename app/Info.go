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
		erra, _ := pg.Sleeper(rod.NotFoundSleeper).Element("._2jz5U")
		var rightAnswer string
		if erra != nil {
			rightAnswer = pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('._2jz5U span')).map(x => x.innerText).join('')").Str()
			if rightAnswer == "" {
				rightAnswer = erra.MustText()
			}
		}

		if strings.Contains(heading, "What sound does this make") {
			prompt := pg.MustEval("() => document.querySelector('._25SW8').innerText").Str()
			options := make([]string, 0, 10)
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
		} else if strings.Contains(heading, "Select the correct character") {
			options := make([]string, 0, 10)
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('.APqdQ')).map(x => x.innerText)").Val().([]interface{}) {
				options = append(options, opt.(string))
			}
			info <- Challenge{
				Type:        SelectCharacter,
				Title:       heading,
				Prompt:      "",
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Tap the matching pairs") || strings.Contains(heading, "Select the matching pairs") {
			options := make([]string, 0, 10)
			for _, opt := range pg.MustEval(`() => Array.prototype.slice.call(document.querySelectorAll(".WxjqG")).map(x => x.querySelector("._231NG").innerText)`).Val().([]interface{}) {
				options = append(options, opt.(string))
				if len(options) == 10 {
					break
				}
			}
			info <- Challenge{
				Type:        Matching,
				Title:       heading,
				Prompt:      "",
				Options:     options,
				RightAnswer: rightAnswer,
			}
		} else if strings.Contains(heading, "Fill in the blank") {
			prompt := pg.MustEval("() => Array.prototype.slice.call(document.querySelector('._3gSoe').children[0].children).map(x => x.className == '_5HFLU' ? x.innerText : '_______').join('')").Str()
			options := make([]string, 0, 10)
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
			options := make([]string, 0, 10)
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
			options := make([]string, 0, 10)
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
			//prompt := pg.MustEval("() => Array.prototype.slice.call(document.querySelectorAll('._5HFLU')).map(x => x.innerText).join('\n')").Str()
			prompt := pg.MustEval("() => document.querySelector('._5HFLU').innerText").Str()
			options := make([]string, 0, 10)
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
			options := make([]string, 0, 10)
			for _, opt := range pg.MustEval("() => Array.prototype.slice.call(document.querySelector('.eSgkc').children).map(x => x.innerText)").Val().([]interface{}) {
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
