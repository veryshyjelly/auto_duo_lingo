package main

import (
	"auto_duo_lingo/app"
	"auto_duo_lingo/routes"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"log"
	"net/http"
	"os"
)

func main() {
	headless := true
	if len(os.Args) > 1 && os.Args[1] == "head" {
		headless = false
	}

	l := launcher.New().Headless(headless).UserDataDir("../bd/")
	browser := rod.New().ControlURL(l.MustLaunch()).MustConnect()
	defer browser.MustClose()

	action := make(chan app.ActionData, 1)
	doneAction := make(chan interface{}, 1)
	info := make(chan app.Challenge, 1)
	doGetInfo := make(chan interface{}, 1)

	page := browser.MustPage("https://www.duolingo.com/").
		MustSetViewport(1920, 1080, 1, false).MustWindowMaximize()

	// Start the handlers on a different thread 🧵
	go app.HandleAction(action, page, doneAction)
	go app.GetInfo(doGetInfo, info, page)

	// Register the http routes ⛲
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/info", routes.GetInfo(doGetInfo, info))
	http.HandleFunc("/action", routes.DoAction(action, doneAction, doGetInfo, info))

	log.Println("server started at http://localhost:8001")
	log.Panicln(http.ListenAndServe(":8001", nil))
}
