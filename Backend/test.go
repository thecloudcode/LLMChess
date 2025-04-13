package main

import (
	"Backend/rate-limiter-token-bucket"
	"encoding/json"
	"log"
	"net/http"
)

type Message struct {
	Status string `json:"status"`
	Body   string `json:"body"`
}

func endpointHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	message := Message{
		Status: "Successful",
		Body:   "Hi! You've reached the API.",
	}
	_ = json.NewEncoder(w).Encode(message)
}

func main() {
	http.Handle("/ping", rate_limiter_token_bucket.RateLimiter(endpointHandler))
	log.Println("Server running on port 8090...")
	if err := http.ListenAndServe(":8090", nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
