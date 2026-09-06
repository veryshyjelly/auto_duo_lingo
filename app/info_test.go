package app

import "testing"

func TestDetectChallengeType(t *testing.T) {
	targetHeading := TargetLanguageHeading("ja")

	tests := []struct {
		heading  string
		expected ChallengeType
	}{
		{"What sound does this make?", ChooseOption},
		{"Select the correct meaning", ChooseOption},
		{"Fill in the blank", ChooseOption},
		{"Select the missing word", ChooseOption},
		{"Complete the chat", ChooseOption},
		{"Tap the matching pairs", Matching},
		{"Select the matching pairs", Matching},
		{"Write this in English", ToEnglish},
		{"Write this in Japanese", ToJapanese},
		{"Some unknown heading", Nothing},
	}

	for _, tt := range tests {
		got := DetectChallengeType(tt.heading, targetHeading)
		if got != tt.expected {
			t.Errorf("DetectChallengeType(%q) = %v, want %v", tt.heading, got, tt.expected)
		}
	}
}

func TestTargetLanguageHeading(t *testing.T) {
	if TargetLanguageHeading("es") != "Write this in Spanish" {
		t.Fatalf("expected Spanish heading")
	}
	if TargetLanguageHeading("unknown") != "Write this in Japanese" {
		t.Fatalf("expected Japanese fallback heading")
	}
}
