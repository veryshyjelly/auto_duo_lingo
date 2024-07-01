package routes

import (
	"auto_duo_lingo/app"
	"encoding/json"
	"net/http"
)

func GetInfo(doGetInfo chan bool, info chan app.Challenge) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		doGetInfo <- true
		information := <-info
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(information)
	}
}
