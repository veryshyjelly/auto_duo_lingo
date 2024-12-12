package routes

import (
	"auto_duo_lingo/app"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func Connect(action chan app.ActionData, doneAction chan interface{}, server *app.Server) fiber.Handler {
	return websocket.New(func(conn *websocket.Conn) {
		client := app.NewClient(conn)
		server.AddClient(&client)
		server.Update <- true
		go client.Listen(action, doneAction, server)
		client.Serve(server)
	})
}
