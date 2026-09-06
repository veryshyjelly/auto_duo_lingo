package app

import (
	"fmt"
	"log"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

const antiDetectionJS = `() => {
	Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
}`

// ConnectBrowser launches or attaches to Chrome for Duolingo automation.
// visible=true opens a normal-looking browser window (use for first-time login).
func ConnectBrowser(cfg Config, visible bool) (*rod.Browser, error) {
	if cfg.RodURL != "" {
		log.Printf("Connecting to existing browser at %s", cfg.RodURL)
		return rod.New().ControlURL(cfg.RodURL).MustConnect(), nil
	}

	l := newStealthLauncher(cfg, visible)
	controlURL := l.MustLaunch()
	browser := rod.New().ControlURL(controlURL).MustConnect()
	return browser, nil
}

// ConnectUserBrowser launches Chrome in user mode (minimal automation flags).
// Quit Chrome completely before running this — required for Google sign-in.
func ConnectUserBrowser() (*rod.Browser, error) {
	log.Println("User mode: quit Google Chrome completely before continuing.")
	log.Println("This mode uses your real Chrome profile so Google sign-in works.")

	wsURL := launcher.NewUserMode().MustLaunch()
	return rod.New().ControlURL(wsURL).MustConnect().NoDefaultDevice(), nil
}

func newStealthLauncher(cfg Config, visible bool) *launcher.Launcher {
	l := launcher.New().
		Headless(!visible).
		UserDataDir(cfg.UserDataDir).
		Delete("enable-automation").
		Set("disable-blink-features", "AutomationControlled").
		Set("exclude-switches", "enable-automation").
		Set("lang", "en-US")

	if bin := resolveChromeBin(cfg.ChromeBin); bin != "" {
		log.Printf("Using Chrome binary: %s", bin)
		l = l.Bin(bin)
	} else {
		log.Println("System Chrome not found — using Rod's bundled Chromium (Google login may fail)")
	}

	return l
}

func resolveChromeBin(override string) string {
	if override != "" {
		return override
	}
	if bin, ok := launcher.LookPath(); ok {
		return bin
	}
	return ""
}

func SetupPage(browser *rod.Browser) *rod.Page {
	pg := browser.MustPage("https://www.duolingo.com/")
	pg.MustEvalOnNewDocument(antiDetectionJS)
	pg.MustWindowMaximize()
	pg.MustSetViewport(1536, 776, 1, false)
	return pg
}

func ParseBrowserMode(args []string) (mode string, err error) {
	if len(args) <= 1 {
		return "headless", nil
	}

	switch args[1] {
	case "head", "headless", "login", "user":
		return args[1], nil
	default:
		return "", fmt.Errorf("unknown mode %q (use: headless, head, login, or user)", args[1])
	}
}

func IsVisibleMode(mode string) bool {
	return mode == "head" || mode == "login"
}

func LogLoginHelp(mode string) {
	if mode != "login" && mode != "user" {
		return
	}

	log.Println("")
	log.Println("=== Duolingo login ===")
	if mode == "user" {
		log.Println("1. Chrome should open with your normal profile.")
		log.Println("2. Sign in to Duolingo (Google should work in user mode).")
	} else {
		log.Println("1. A Chrome window will open — sign in to Duolingo.")
		log.Println("2. If Google says 'browser is not secure', try either:")
		log.Println("   • make login-user   (uses your real Chrome profile)")
		log.Println("   • Sign in with email/password on Duolingo instead of Google")
	}
	log.Println("3. Once logged in, stop the server (Ctrl+C) and run: make run")
	log.Println("")
}
