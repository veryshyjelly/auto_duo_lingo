package main

import (
	"auto_duo_lingo/app"
	"auto_duo_lingo/routes"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/go-rod/rod"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	cfg := app.LoadConfig()

	mode, err := app.ParseBrowserMode(os.Args)
	if err != nil {
		log.Fatal(err)
	}

	app.LogLoginHelp(mode)

	var browser *rod.Browser
	switch mode {
	case "user":
		browser, err = app.ConnectUserBrowser()
	default:
		browser, err = app.ConnectBrowser(cfg, app.IsVisibleMode(mode))
	}
	if err != nil {
		log.Fatal(err)
	}
	defer browser.MustClose()

	page := make(chan *rod.Page, 1)
	action := make(chan app.ActionData, 1)
	doneAction := make(chan interface{}, 1)
	info := make(chan app.Challenge, 1)
	doGetInfo := make(chan interface{}, 1)

	pg := app.SetupPage(browser)
	page <- pg

	server := app.NewServer()

	go app.HandleAction(action, page, doneAction, cfg.DuolingoLessonURL)
	go app.GetInfo(doGetInfo, info, page, cfg.TargetLang)
	go server.Serve(doGetInfo, info)

	lanIP := getOutboundIP()
	lanURL := fmt.Sprintf("http://%s:%s", lanIP, cfg.Port)
	log.Printf("Open on your phone: %s", lanURL)
	if cfg.AuthToken != "" {
		log.Println("AUTH_TOKEN is set — WebSocket clients must pass ?token=...")
	}

	fiberApp := fiber.New()
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "*",
		AllowHeaders: "*",
	}))

	fiberApp.Static("/", "./static")
	fiberApp.Get("/status", routes.Status(&server, lanURL))
	fiberApp.Get("/audio", routes.AudioProxy())
	fiberApp.Get("/duo-css", routes.DuoCSS())
	fiberApp.Get("/connect", routes.Connect(action, doneAction, &server, cfg.AuthToken))

	log.Fatal(fiberApp.Listen(":" + cfg.Port))
}

func getOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Printf("could not detect LAN IP: %v", err)
		return "localhost"
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP.String()
}
