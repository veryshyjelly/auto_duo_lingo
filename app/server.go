package app

import (
	"log"
	"sync"
	"time"
)

type Server struct {
	Clients map[*Client]bool
	mutex   sync.Mutex
	update  chan struct{}
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
				log.Println("[SCRAPPING] 🃏")
				doGetInfo <- true
				information := <-info

				for c := range s.Clients {
					c.Updates <- information
				}
			}
			s.mutex.Unlock()
			time.Sleep(time.Millisecond * 150)
		}
	}
}
