package app

import (
	"log"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Connection *websocket.Conn
	Updates    chan Challenge
}

func NewClient(conn *websocket.Conn) Client {
	return Client{
		Connection: conn,
		Updates:    make(chan Challenge, 100),
	}
}

func (c *Client) Listen(action chan ActionData, doneAction chan interface{}, server *Server) {
	for {
		var update ActionData

		if err := c.Connection.ReadJSON(&update); err != nil {
			log.Println("[ERROR] while reading message from client", err)
			break
		}

		action <- update
		log.Println("[DOING ACTION]")
		<-doneAction
		server.Update <- true
	}
}

func (c *Client) Serve(server *Server) {
	for {
		u := <-c.Updates
		if err := c.Connection.WriteJSON(u); err != nil {
			log.Println("[ERROR] error occurred writing update to client", err)
			server.RemoveClient(c)
			break
		}
	}
}
