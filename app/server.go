package app

import (
	"bytes"
	"encoding/json"
	"log"
	"sync"
	"time"
)

type Server struct {
	Clients    map[*Client]bool
	mutex      sync.Mutex
	update     chan struct{}
	lastPushed Challenge
	hasPushed  bool
}

func NewServer() Server {
	return Server{
		Clients: map[*Client]bool{},
		mutex:   sync.Mutex{},
		update:  make(chan struct{}, 1),
	}
}

func (s *Server) Update() {
	select {
	case s.update <- struct{}{}:
	default:
	}
}

func (s *Server) AddClient(c *Client) {
	s.mutex.Lock()
	c.needsSnapshot = true
	s.Clients[c] = true
	s.mutex.Unlock()
}

func (s *Server) RemoveClient(c *Client) {
	s.mutex.Lock()
	delete(s.Clients, c)
	s.mutex.Unlock()
}

func (s *Server) ClientCount() int {
	s.mutex.Lock()
	count := len(s.Clients)
	s.mutex.Unlock()
	return count
}

func (s *Server) Serve(doGetInfo chan interface{}, info chan Challenge) {
	for {
		<-s.update
		for i := 0; i < 10; i++ {
			s.mutex.Lock()
			if len(s.Clients) > 0 {
				log.Println("[SCRAPING] 🃏")
				doGetInfo <- true
				information := <-info

				changed := !s.hasPushed || !challengesEqual(information, s.lastPushed)
				if changed {
					s.lastPushed = information
					s.hasPushed = true
				}

				for c := range s.Clients {
					if changed || c.needsSnapshot {
						c.Updates <- information
						c.needsSnapshot = false
					}
				}
			}
			s.mutex.Unlock()
			time.Sleep(time.Millisecond * 150)
		}
	}
}

func challengesEqual(a, b Challenge) bool {
	ja, errA := json.Marshal(a)
	jb, errB := json.Marshal(b)
	if errA != nil || errB != nil {
		return false
	}
	return bytes.Equal(ja, jb)
}
