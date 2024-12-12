package routes

import (
	"auto_duo_lingo/app"
	"log"

	"github.com/gofiber/fiber/v2"
)

func DoAction(action chan app.ActionData, doneAction chan interface{}, doGetInfo chan interface{}, info chan app.Challenge) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var data app.ActionData
		if err := c.BodyParser(&data); err != nil {
			return err
		}
		action <- data

		log.Println("scraping webpage 🃏")
		doGetInfo <- <-doneAction
		information := <-info

		log.Printf("returning info ℹ️: %v\n", information)
		return c.JSON(information)
	}
}
