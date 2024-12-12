package app

type ChallengeType uint8

const (
	Matching ChallengeType = iota
	ChooseOption
	ToEnglish
	ToJapanese
	Nothing
)

type Challenge struct {
	Type        ChallengeType `json:"type"`
	Progress    int           `json:"progress"`
	Title       string        `json:"title"`
	Prompt      string        `json:"prompt"`
	Options     []interface{} `json:"options"`
	RightAnswer string        `json:"rightAnswer"`
}

type Action uint8

const (
	START Action = iota
	CONTINUE
	MATCH
	CHOOSE
	ENGLISH
	JAPANESE
	PLAY
	REFRESH
)

type ActionData struct {
	Type              Action   `json:"type"`
	OptionValue       string   `json:"optionValue"`
	EnglishChips      []string `json:"englishChips"`
	JapaneseTranslate string   `json:"japaneseTranslate"`
}
