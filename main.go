package main

import (
	"auto_duo_lingo/app"
	"auto_duo_lingo/routes"
	"log"
	"net"
	"os"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	headless := true
	if len(os.Args) > 1 && os.Args[1] == "head" {
		headless = false
	}

	l := launcher.New().Headless(headless).UserDataDir("../bd/")
	browser := rod.New().ControlURL(l.MustLaunch()).MustConnect()
	defer browser.MustClose()

	// u := os.Args[1]
	// browser := rod.New().ControlURL(u).MustConnect()

	page := make(chan *rod.Page, 1)
	action := make(chan app.ActionData, 1)
	doneAction := make(chan interface{}, 1)
	info := make(chan app.Challenge, 1)
	doGetInfo := make(chan interface{}, 1)

	pg := browser.MustPage("https://www.duolingo.com/").MustWindowMaximize()
	pg.MustSetViewport(1536, 776, 1, false)
	page <- pg // Having it this way prevent multiply usage of page in any case 🦺

	server := app.NewServer()

	// Start the handlers on a different thread 🧵
	go app.HandleAction(action, page, doneAction)
	go app.GetInfo(doGetInfo, info, page)
	go server.Serve(doGetInfo, info)

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Allows all origins
		AllowMethods: "*", // Allows all HTTP methods
		AllowHeaders: "*", // Allows all headers
	}))

	// Register the http routes ⛲
	app.Static("/", "./static")
	app.Get("/info", routes.GetInfo(doGetInfo, info))
	app.Get("/action", routes.DoAction(action, doneAction, doGetInfo, info))
	app.Get("/connect", routes.Connect(action, doneAction, &server))

	app.Listen(":8080")
}

func GetOutboundIP() net.IP {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP
}
