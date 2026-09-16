package app

import "strings"

var challengeHeadings = map[ChallengeType][]string{
	ChooseOption: {
		"What sound does this make",
		"Select the correct",
		"Fill in the blank",
		"Select the missing word",
		"Read and respond",
		"Which one of these is",
		"Complete the chat",
	},
	Matching: {
		"Tap the matching pairs",
		"Select the matching pairs",
	},
	ToEnglish: {
		"Write this in English",
	},
}

var typeInTargetLangHeadings = []string{
	"Type what you hear",
}

func DetectChallengeType(heading string, targetLangHeading string) ChallengeType {
	for challengeType, headings := range challengeHeadings {
		for _, h := range headings {
			if strings.Contains(heading, h) {
				return challengeType
			}
		}
	}
	for _, h := range typeInTargetLangHeadings {
		if strings.Contains(heading, h) {
			return ToJapanese
		}
	}
	if strings.Contains(heading, targetLangHeading) {
		return ToJapanese
	}
	return Nothing
}
