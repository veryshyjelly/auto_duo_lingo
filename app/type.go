package app

type ChallengeType uint8

const (
	GuessSound ChallengeType = iota
	SelectCharacter
	Matching
	FillInTheBlank
	WhichOneOfThese
	ToEnglish
	ToJapanese
	Nothing
)

type Challenge struct {
	Type        ChallengeType `json:"type"`
	Title       string        `json:"title"`
	Prompt      string        `json:"prompt"`
	Options     []string      `json:"options"`
	RightAnswer string        `json:"rightAnswer"`
}
