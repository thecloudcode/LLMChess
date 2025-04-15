package main

import (
	"Backend/api"
	"Backend/rateLimiter"
	"Backend/redis"
	"log"
	"net/http"
)

func main() {
	redis.InitRedis()
	log.Println("Redis successfully initialized")

	http.Handle("/api/chess", rateLimiter.RateLimiter(http.HandlerFunc(api.StockfishLLMHandler)))

	log.Println("Chess server listening on port 8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Server failed:", err)
	}

}
