package app

import (
	"log"
	"sync"
	"time"
)

type Server struct {
	Clients map[*Client]bool
	mutex   sync.Mutex
	Update  chan interface{}
}

func NewServer() Server {
	return Server{
		Clients: map[*Client]bool{},
		mutex:   sync.Mutex{},
		Update:  make(chan interface{}, 10),
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

func (s *Server) Serve(doGetInfo chan interface{}, info chan Challenge) {
	for {
		<-s.Update
		s.Update = make(chan interface{}, 10)
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

			time.Sleep(time.Millisecond * 250)
		}
	}
}
