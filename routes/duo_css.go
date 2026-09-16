package routes

import (
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

var cssURLRe = regexp.MustCompile(`url\(\s*['"]?([^'")]+)['"]?\s*\)`)

// DuoCSS fetches Duolingo stylesheets server-side and serves them over HTTP so
// phone clients on plain HTTP can load styles (and nested fonts/imports) without
// mixed-content issues.
func DuoCSS() fiber.Handler {
	client := &http.Client{Timeout: 20 * time.Second}

	return func(c *fiber.Ctx) error {
		rawURL := c.Query("url")
		if rawURL == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing url query param"})
		}

		parsed, err := url.Parse(rawURL)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid url"})
		}

		if !isAllowedDuoAssetHost(parsed.Host) {
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
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch css"})
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "upstream returned " + resp.Status})
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to read css"})
		}

		css := rewriteCSSForProxy(string(body), parsed)
		c.Set("Content-Type", "text/css; charset=utf-8")
		c.Set("Cache-Control", "public, max-age=86400")
		return c.SendString(css)
	}
}

func isAllowedDuoAssetHost(host string) bool {
	host = strings.ToLower(host)
	return strings.Contains(host, "cloudfront.net") ||
		strings.Contains(host, "duolingo.com") ||
		strings.Contains(host, "duocdn") ||
		strings.Contains(host, "d35aaqx5ub95lt") ||
		strings.Contains(host, "dwzcxfhh6qbm2") ||
		strings.Contains(host, "gstatic.com") ||
		strings.Contains(host, "googleapis.com")
}

func rewriteCSSForProxy(css string, base *url.URL) string {
	css = rewriteCSSImports(css, base)
	css = rewriteCSSURLs(css, base)
	css = rewriteRootSelectors(css)
	return css
}

// Shadow DOM has no :root — remap Duolingo design tokens to :host.
func rewriteRootSelectors(css string) string {
	return strings.ReplaceAll(css, ":root", ":host")
}

func rewriteCSSURLs(css string, base *url.URL) string {
	return cssURLRe.ReplaceAllStringFunc(css, func(match string) string {
		parts := cssURLRe.FindStringSubmatch(match)
		if len(parts) < 2 {
			return match
		}
		raw := strings.TrimSpace(parts[1])
		if strings.HasPrefix(raw, "data:") || strings.HasPrefix(raw, "/duo-css?") {
			return match
		}
		resolved := resolveAssetURL(base, raw)
		if resolved == "" || !isAllowedDuoAssetHost(mustParseHost(resolved)) {
			return match
		}
		proxied := "/duo-css?url=" + url.QueryEscape(resolved)
		return `url("` + proxied + `")`
	})
}

var cssImportRe = regexp.MustCompile(`(?i)@import\s+(?:url\s*\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*;`)

func rewriteCSSImports(css string, base *url.URL) string {
	return cssImportRe.ReplaceAllStringFunc(css, func(match string) string {
		parts := cssImportRe.FindStringSubmatch(match)
		if len(parts) < 2 {
			return match
		}
		raw := strings.TrimSpace(parts[1])
		if raw == "" && len(parts) >= 3 {
			raw = strings.TrimSpace(parts[2])
		}
		if raw == "" || strings.HasPrefix(raw, "/duo-css?") {
			return match
		}
		resolved := resolveAssetURL(base, raw)
		if resolved == "" || !isAllowedDuoAssetHost(mustParseHost(resolved)) {
			return match
		}
		proxied := "/duo-css?url=" + url.QueryEscape(resolved)
		return `@import url("` + proxied + `");`
	})
}

func resolveAssetURL(base *url.URL, raw string) string {
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}
	ref, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	return base.ResolveReference(ref).String()
}

func mustParseHost(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return u.Host
}
