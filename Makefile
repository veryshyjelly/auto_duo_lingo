.PHONY: dev build-ui run run-head login login-user chrome-login test test-go test-ui

dev:
	cd frontend/auto-duo-lingo && npm run dev

build-ui:
	cd frontend/auto-duo-lingo && npm run build
	cp -r frontend/auto-duo-lingo/dist/* static/

run:
	go run .

run-head:
	go run . head

login:
	go run . login

login-user:
	go run . user

chrome-login:
	bash scripts/chrome-login.sh

test: test-go test-ui

test-go:
	go test ./...

test-ui:
	cd frontend/auto-duo-lingo && npm test
