package app

import (
	"testing"
	"time"
)

func TestServerUpdateCoalescing(t *testing.T) {
	server := NewServer()

	for i := 0; i < 100; i++ {
		server.Update()
	}

	select {
	case <-server.update:
	case <-time.After(time.Second):
		t.Fatal("expected a pending update signal")
	}

	select {
	case <-server.update:
		t.Fatal("expected only one pending update signal")
	default:
	}
}

func TestChallengesEqual(t *testing.T) {
	a := Challenge{Type: ChooseOption, Title: "Fill in the blank", Progress: 10}
	b := Challenge{Type: ChooseOption, Title: "Fill in the blank", Progress: 10}
	if !challengesEqual(a, b) {
		t.Fatal("expected identical challenges to be equal")
	}

	b.Progress = 20
	if challengesEqual(a, b) {
		t.Fatal("expected different progress to differ")
	}
}

func TestClientCount(t *testing.T) {
	server := NewServer()
	if server.ClientCount() != 0 {
		t.Fatalf("expected zero clients")
	}

	client := &Client{}
	server.AddClient(client)
	if server.ClientCount() != 1 {
		t.Fatalf("expected one client")
	}

	server.RemoveClient(client)
	if server.ClientCount() != 0 {
		t.Fatalf("expected zero clients after removal")
	}
}
