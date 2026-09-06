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
