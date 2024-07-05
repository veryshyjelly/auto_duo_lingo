package app

type ChallengeType uint8

const (
	SelectCharacter ChallengeType = iota
	Matching
	FillInTheBlank
	ToEnglish
	ToJapanese
	Nothing
)

type Challenge struct {
	Type        ChallengeType `json:"type"`
	Progress    int           `json:"progress"`
	Title       string        `json:"title"`
	Prompt      string        `json:"prompt"`
	Options     []string      `json:"options"`
	RightAnswer string        `json:"rightAnswer"`
}
