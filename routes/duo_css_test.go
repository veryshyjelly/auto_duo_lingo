package routes

import (
	"net/url"
	"testing"
)

func TestRewriteCSSForProxy(t *testing.T) {
	base, _ := url.Parse("https://d35aaqx5ub95lt.cloudfront.net/css/main.abc.css")

	css := `@import url("other.css");
.btn { background: url(../fonts/din.woff2); }
.icon { background: url(data:image/png;base64,abc); }`

	out := rewriteCSSForProxy(css, base)

	if !contains(out, `/duo-css?url=`) {
		t.Fatalf("expected proxied urls, got: %s", out)
	}
	if !contains(out, "data:image") {
		t.Fatalf("data urls should be preserved, got: %s", out)
	}
}

func TestRewriteRootSelectors(t *testing.T) {
	in := ":root { --color-snow: #fff; } :root, body { margin: 0; }"
	out := rewriteRootSelectors(in)
	if contains(out, ":root") {
		t.Fatalf(":root should be rewritten to :host, got: %s", out)
	}
	if !contains(out, ":host") {
		t.Fatalf("expected :host in output, got: %s", out)
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || findSub(s, sub))
}

func findSub(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func TestIsAllowedDuoAssetHost(t *testing.T) {
	if !isAllowedDuoAssetHost("d35aaqx5ub95lt.cloudfront.net") {
		t.Fatal("cloudfront should be allowed")
	}
	if isAllowedDuoAssetHost("evil.com") {
		t.Fatal("evil.com should be blocked")
	}
}
