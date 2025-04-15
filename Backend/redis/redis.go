package redis

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
)

func main() {
	fmt.Println("Go Redis Tutorial")
	client := redis.NewClient(&redis.Options{
		Addr:     "",
		Password: "",
		DB:       0,
	})

	ping, err := client.Ping(context.Background()).Result()
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	fmt.Println(ping)
	err = client.Set(context.Background(), "name", "Elliot", 0).Err()
	if err != nil {
		fmt.Printf("Failed to set value in the redis instance")
		return
	}

	val, err := client.Get(context.Background(), "name").Result()
	if err != nil {
		fmt.Printf("failed to get value from redis")
		return
	}
	fmt.Printf("%s\n", val)
}
