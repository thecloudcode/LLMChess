package rateLimiter

import (
	"encoding/json"
	"golang.org/x/time/rate"
	"net/http"
)

type Message struct {
	Status string `json:"status"`
	Body   string `json:"body"`
}

func RateLimiter(next http.HandlerFunc) http.Handler {
	limiter := rate.NewLimiter(2, 4)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !limiter.Allow() {
			message := Message{
				Status: "Request Denied",
				Body:   "The Api is at capacity, try again later",
			}
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(message)
			return
		} else {
			next.ServeHTTP(w, r)
		}
	})
}
