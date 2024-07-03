// Package main ...
package main

import (
	"auto_duo_lingo/app"
	"auto_duo_lingo/routes"
	"fmt"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"log"
	"net/http"
	"time"
)

func main() {
	l := launcher.New().Bin("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe").Headless(false).UserDataDir("../bd/")
	browser := rod.New().ControlURL(l.MustLaunch()).MustConnect().Trace(true)
	defer browser.Close()

	action := make(chan app.ActionData, 1)
	doneAction := make(chan bool, 1)
	page := make(chan *rod.Page, 1)
	info := make(chan app.Challenge, 1)
	doGetInfo := make(chan bool, 1)

	page <- browser.MustPage("https://www.duolingo.com/")

	time.Sleep(time.Second * 2)

	go app.HandleAction(action, page, doneAction)
	go app.GetInfo(doGetInfo, info, page)

	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/info", routes.GetInfo(doGetInfo, info))
	http.HandleFunc("/action", routes.DoAction(action, doneAction, doGetInfo, info))

	fmt.Println("server started at http://localhost:8001")
	log.Panicln(http.ListenAndServe(":8001", nil))
}
