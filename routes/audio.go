package routes

import (
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// AudioProxy streams TTS audio from Duolingo's CDN so the phone client can play it
// without CORS issues.
func AudioProxy() fiber.Handler {
	client := &http.Client{Timeout: 15 * time.Second}

	return func(c *fiber.Ctx) error {
		rawURL := c.Query("url")
		if rawURL == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing url query param"})
		}

		parsed, err := url.Parse(rawURL)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid url"})
		}

		host := strings.ToLower(parsed.Host)
		if !strings.Contains(host, "cloudfront.net") && !strings.Contains(host, "duolingo.com") {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "url host not allowed"})
		}

		req, err := http.NewRequestWithContext(c.Context(), http.MethodGet, rawURL, nil)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create request"})
		}
		req.Header.Set("User-Agent", "Mozilla/5.0")
		req.Header.Set("Referer", "https://www.duolingo.com/")

		resp, err := client.Do(req)
		if err != nil {
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch audio"})
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "upstream returned " + resp.Status})
		}

		contentType := resp.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "audio/mpeg"
		}

		c.Set("Content-Type", contentType)
		c.Set("Cache-Control", "public, max-age=86400")
		_, err = io.Copy(c.Response().BodyWriter(), resp.Body)
		return err
	}
}
