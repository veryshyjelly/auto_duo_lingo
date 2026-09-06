package routes

import (
	"auto_duo_lingo/app"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func Connect(action chan app.ActionData, doneAction chan interface{}, server *app.Server, authToken string) fiber.Handler {
	return websocket.New(func(conn *websocket.Conn) {
		if authToken != "" && conn.Query("token") != authToken {
			log.Println("[AUTH] rejected WebSocket connection: invalid token")
			conn.Close()
			return
		}

		client := app.NewClient(conn)
		server.AddClient(&client)
		server.Update()
		go client.Listen(action, doneAction, server)
		client.Serve(server)
	})
}
