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
		log.Printf("doing action: %#v", data)
		action <- data
		doGetInfo <- <-doneAction
		information := <-info
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(information)
	}
}
