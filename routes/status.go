package routes

import (
	"auto_duo_lingo/app"

	"github.com/gofiber/fiber/v2"
)

func Status(server *app.Server, lanURL string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"lanUrl":           lanURL,
			"connectedClients": server.ClientCount(),
		})
	}
}
