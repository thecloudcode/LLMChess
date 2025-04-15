package redis

import (
	"context"
	"github.com/go-redis/redis/v8"
	"os"
)

var Ctx = context.Background()
var Client *redis.Client

func InitRedis() {
	redisURl := os.Getenv("REDIS_URL")
	opt, err := redis.ParseURL(redisURl)
	if err != nil {
		panic("Invalid Redis URL: " + err.Error())
	}
	Client = redis.NewClient(opt)
}
