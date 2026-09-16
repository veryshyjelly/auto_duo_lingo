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
	Options       []string      `json:"options"`
	OptionImages  []string      `json:"optionImages,omitempty"`
	InputPlaceholder string       `json:"inputPlaceholder,omitempty"`
	InputLang        string       `json:"inputLang,omitempty"`
	ChallengeHTML    string       `json:"challengeHtml,omitempty"`
	StyleHrefs       []string     `json:"styleHrefs,omitempty"`
	DesignTokens     string       `json:"designTokens,omitempty"`
	RightAnswer   string        `json:"rightAnswer"`
	Error       string        `json:"error,omitempty"`
	AudioUrls   []string      `json:"audioUrls,omitempty"`
	HasAudio    bool          `json:"hasAudio"`
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
)

type ActionData struct {
	Type              Action   `json:"type"`
	OptionValue       string   `json:"optionValue"`
	EnglishChips      []string `json:"englishChips"`
	JapaneseTranslate string   `json:"japaneseTranslate"`
}
