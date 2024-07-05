package routes

import (
	"auto_duo_lingo/app"
	"encoding/json"
	"log"
	"net/http"
)

func DoAction(action chan app.ActionData, doneAction chan bool, doGetInfo chan bool, info chan app.Challenge) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		body := r.Body
		defer body.Close()
		var data app.ActionData
		err := json.NewDecoder(body).Decode(&data)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
		}
		action <- data
		log.Println("scraping webpage 🃏")
		doGetInfo <- <-doneAction
		information := <-info
		log.Printf("returning info ℹ️: %v\n", information)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(information)
	}
}
