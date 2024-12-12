package app

import (
	"log"
	"time"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	Connection *websocket.Conn
}

func NewClient(conn *websocket.Conn) Client {
	return Client{
		Connection: conn,
	}
}

func (c *Client) Listen(action chan ActionData, doneAction chan interface{}) {
	for {
		var update ActionData
		if err := c.Connection.ReadJSON(&update); err != nil {
			log.Println("error while reading message from client", err)
			c.Connection.Close()
			break
		}

		action <- update
		log.Println("[DOING ACTION]")
		<-doneAction
	}
}

func (c *Client) Serve(doGetInfo chan interface{}, info chan Challenge) {
	/*This function writes the updates to the client connection*/

	for {
		log.Println("scraping webpage 🃏")
		doGetInfo <- true
		information := <-info

		if err := c.Connection.WriteJSON(information); err != nil {
			log.Println("[ERROR] error occurred writing update to client", err)
			break
		}

		time.Sleep(time.Millisecond * 700)
	}

}
