package main

import (
	"Backend/api"
	"Backend/rateLimiter"
	"log"
	"net/http"
)

func main() {
	http.Handle("/api/chess", rateLimiter.RateLimiter(http.HandlerFunc(api.StockfishLLMHandler)))

	log.Println("Chess server listening on port 8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Server failed:", err)
	}
}
