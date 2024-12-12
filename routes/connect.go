package routes

import (
	"auto_duo_lingo/app"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func Connect(action chan app.ActionData, doneAction chan interface{}, doGetInfo chan interface{}, info chan app.Challenge) fiber.Handler {
	return websocket.New(func(conn *websocket.Conn) {
		client := app.NewClient(conn)
		go client.Listen(action, doneAction)
		client.Serve(doGetInfo, info)
	})
}
