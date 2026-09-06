package app

import (
	"os"
)

type Config struct {
	Port              string
	UserDataDir       string
	DuolingoLessonURL string
	TargetLang        string
	AuthToken         string
	ChromeBin         string
	RodURL            string
}

func LoadConfig() Config {
	return Config{
		Port:              envOr("PORT", "8080"),
		UserDataDir:       envOr("USER_DATA_DIR", "../bd/"),
		DuolingoLessonURL: envOr("DUOLINGO_LESSON_URL", "https://www.duolingo.com/lesson"),
		TargetLang:        envOr("TARGET_LANG", "ja"),
		AuthToken:         os.Getenv("AUTH_TOKEN"),
		ChromeBin:         os.Getenv("CHROME_BIN"),
		RodURL:            os.Getenv("ROD_URL"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func TargetLanguageHeading(lang string) string {
	headings := map[string]string{
		"ja": "Write this in Japanese",
		"es": "Write this in Spanish",
		"fr": "Write this in French",
		"de": "Write this in German",
		"it": "Write this in Italian",
		"pt": "Write this in Portuguese",
		"ko": "Write this in Korean",
		"zh": "Write this in Chinese",
	}
	if h, ok := headings[lang]; ok {
		return h
	}
	return "Write this in Japanese"
}
