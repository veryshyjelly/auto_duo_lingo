package app

import "testing"

func TestLoadConfigDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("USER_DATA_DIR", "")
	t.Setenv("DUOLINGO_LESSON_URL", "")
	t.Setenv("TARGET_LANG", "")

	cfg := LoadConfig()
	if cfg.Port != "8080" {
		t.Fatalf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.UserDataDir != "../bd/" {
		t.Fatalf("expected default user data dir")
	}
	if cfg.TargetLang != "ja" {
		t.Fatalf("expected default target lang ja")
	}
}
