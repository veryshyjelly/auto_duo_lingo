package routes

import (
	"auto_duo_lingo/app"
	"encoding/json"
	"log"
	"net/http"
)

func GetInfo(doGetInfo chan bool, info chan app.Challenge) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("scraping webpage 🃏")
		doGetInfo <- true
		information := <-info
		log.Printf("returning info ℹ️: %v\n", information)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(information)
	}
}
