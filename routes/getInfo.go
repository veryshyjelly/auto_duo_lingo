package routes

import (
	"auto_duo_lingo/app"
	"log"

	"github.com/gofiber/fiber/v2"
)

func GetInfo(doGetInfo chan interface{}, info chan app.Challenge) fiber.Handler {
	return func(c *fiber.Ctx) error {

		log.Println("scraping webpage 🃏")
		doGetInfo <- true

		information := <-info
		log.Printf("returning info ℹ️: %v\n", information)

		return c.JSON(information)
	}
}
