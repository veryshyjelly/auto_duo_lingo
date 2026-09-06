package app

import "testing"

func TestPickBestAudioUrls_prefersSentenceOverToken(t *testing.T) {
	token := "https://d7mj4aqfscim2.cloudfront.net/tts/ja/token/%E3%82%B9%E3%83%88%E3%83%AC%E3%82%B9"
	sentence := "https://d7mj4aqfscim2.cloudfront.net/tts/ja/sentence/abc123full"

	got := pickBestAudioUrls([]string{token, sentence})
	if len(got) == 0 || got[0] != sentence {
		t.Fatalf("expected sentence URL first, got %v", got)
	}
}

func TestPickBestAudioUrls_longerNonTokenWins(t *testing.T) {
	short := "https://d7mj4aqfscim2.cloudfront.net/tts/ja/token/a"
	longer := "https://d7mj4aqfscim2.cloudfront.net/tts/ja/file/long-encoded-sentence-audio"

	got := pickBestAudioUrls([]string{short, longer})
	if got[0] != longer {
		t.Fatalf("expected longer non-token URL first, got %v", got)
	}
}
