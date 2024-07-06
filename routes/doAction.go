package routes

import (
	"auto_duo_lingo/app"
	"encoding/json"
	"log"
	"net/http"
)

func DoAction(action chan app.ActionData, doneAction chan interface{}, doGetInfo chan interface{}, info chan app.Challenge) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var data app.ActionData
		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(err.Error()))
		}
		action <- data

		log.Println("scraping webpage 🃏")
		doGetInfo <- <-doneAction
		information := <-info

		log.Printf("returning info ℹ️: %v\n", information)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(information)
	}
}
