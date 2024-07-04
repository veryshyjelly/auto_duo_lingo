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
	l := launcher.New().Bin("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe").Headless(true).UserDataDir("../bd/")
	//l := launcher.New().Bin("msedgedriver.exe").Headless(true).UserDataDir("../bd/")
	browser := rod.New().ControlURL(l.MustLaunch()).MustConnect().Trace(false)
	defer browser.Close()

	action := make(chan app.ActionData, 2)
	doneAction := make(chan bool, 2)
	page := make(chan *rod.Page, 2)
	info := make(chan app.Challenge, 2)
	doGetInfo := make(chan bool, 2)

	pg := browser.MustPage("https://www.duolingo.com/").
		MustSetViewport(1920, 1080, 1, false).MustWindowMaximize()
	page <- pg
	page <- pg

	time.Sleep(time.Second * 2)

	go app.HandleAction(action, page, doneAction)
	go app.HandleAction(action, page, doneAction)
	go app.GetInfo(doGetInfo, info, page)
	go app.GetInfo(doGetInfo, info, page)

	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/info", routes.GetInfo(doGetInfo, info))
	http.HandleFunc("/action", routes.DoAction(action, doneAction, doGetInfo, info))

	fmt.Println("server started at http://localhost:8001")
	log.Panicln(http.ListenAndServe(":8001", nil))
}
