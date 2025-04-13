package main

import (
	"Backend/api"
	"Backend/rate-limiter-token-bucket"
	"log"
	"net/http"
)

func main() {
	http.Handle("/api/chess", rate_limiter_token_bucket.RateLimiter(http.HandlerFunc(api.StockfishLLMHandler)))

	log.Println("Chess server listening on port 8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Server failed:", err)
	}
}
