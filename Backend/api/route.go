package api

import (
	"bytes"
	"encoding/json"
	//"github.com/joho/godotenv"
	"io"
	"log"
	"net/http"
	"os"
)

type RequestBody struct {
	Model            string              `json:"model"`
	Messages         []map[string]string `json:"messages"`
	Temperature      float64             `json:"temperature"`
	TopP             float64             `json:"top_p"`
	MaxTokens        int                 `json:"max_tokens"`
	FrequencyPenalty float64             `json:"frequency_penalty"`
	PresencePenalty  float64             `json:"presence_penalty"`
	Stream           bool                `json:"stream"`
}

func LoadEnv() {
	if os.Getenv("ENV") != "production" {
		//if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using system environment variables")
		//}
	}
}

func extractContent(rawResponse string) string {
	var response map[string]interface{}
	err := json.Unmarshal([]byte(rawResponse), &response)
	if err != nil {
		log.Fatal("Error unmarshalling response:", err)
	}

	if choices, ok := response["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					return content
				}
			}
		}
	}

	return ""
}

func GetResponse(prompt string) string {
	LoadEnv()

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("Missing API_KEY environment variable")
	}

	model := os.Getenv("MODEL")
	if model == "" {
		log.Fatal("Missing MODEL environment variable")
	}

	requestURL := os.Getenv("REQUEST_URL")
	if requestURL == "" {
		log.Fatal("Missing REQUEST_URL environment variable")
	}

	requestBody := RequestBody{
		Model: model,
		Messages: []map[string]string{
			{"role": "system", "content": prompt},
		},
		Temperature:      0.6,
		TopP:             0.95,
		MaxTokens:        4096,
		FrequencyPenalty: 0,
		PresencePenalty:  0,
		Stream:           false,
	}

	reqBodyJson, err := json.Marshal(requestBody)
	if err != nil {
		log.Fatal("Error marshalling request body:", err)
	}

	req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(reqBodyJson))
	if err != nil {
		log.Fatal("Error creating request:", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal("Error executing request:", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatal("Error reading response body:", err)
	}

	return extractContent(string(bodyBytes))
}

//package api
//
//import (
//	"bytes"
//	"encoding/json"
//	"io"
//	"log"
//	"net/http"
//	"os"
//
//	"github.com/joho/godotenv"
//)
//
//// RequestBody defines the structure for the OpenAI request
//type RequestBody struct {
//	Model            string              `json:"model"`
//	Messages         []map[string]string `json:"messages"`
//	Temperature      float64             `json:"temperature"`
//	TopP             float64             `json:"top_p"`
//	MaxTokens        int                 `json:"max_tokens"`
//	FrequencyPenalty float64             `json:"frequency_penalty"`
//	PresencePenalty  float64             `json:"presence_penalty"`
//	Stream           bool                `json:"stream"`
//}
//
//// LoadEnv loads environment variables from .env if not in production
//func LoadEnv() {
//	if os.Getenv("ENV") != "production" {
//		err := godotenv.Load()
//		if err != nil {
//			log.Println("Warning: No .env file found, using system environment variables")
//		}
//	}
//}
//
//// extractContent parses the raw JSON response and returns the assistant's reply
//func extractContent(rawResponse string) string {
//	var response map[string]interface{}
//	err := json.Unmarshal([]byte(rawResponse), &response)
//	if err != nil {
//		log.Fatal("Error unmarshalling response:", err)
//	}
//
//	if choices, ok := response["choices"].([]interface{}); ok && len(choices) > 0 {
//		if choice, ok := choices[0].(map[string]interface{}); ok {
//			if message, ok := choice["message"].(map[string]interface{}); ok {
//				if content, ok := message["content"].(string); ok {
//					return content
//				}
//			}
//		}
//	}
//
//	return ""
//}
//
//// GetResponse makes the request to the LLM API using a prompt and returns the reply
//func GetResponse(prompt string) string {
//	LoadEnv()
//
//	apiKey := os.Getenv("API_KEY")
//	if apiKey == "" {
//		log.Fatal("Missing API_KEY environment variable")
//	}
//
//	model := os.Getenv("MODEL")
//	if model == "" {
//		log.Fatal("Missing MODEL environment variable")
//	}
//
//	requestURL := os.Getenv("REQUEST_URL")
//	if requestURL == "" {
//		log.Fatal("Missing REQUEST_URL environment variable")
//	}
//
//	requestBody := RequestBody{
//		Model: model,
//		Messages: []map[string]string{
//			{"role": "system", "content": prompt},
//		},
//		Temperature:      0.6,
//		TopP:             0.95,
//		MaxTokens:        4096,
//		FrequencyPenalty: 0,
//		PresencePenalty:  0,
//		Stream:           false,
//	}
//
//	reqBodyJson, err := json.Marshal(requestBody)
//	if err != nil {
//		log.Fatal("Error marshalling request body:", err)
//	}
//
//	req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(reqBodyJson))
//	if err != nil {
//		log.Fatal("Error creating request:", err)
//	}
//
//	req.Header.Set("Content-Type", "application/json")
//	req.Header.Set("Authorization", "Bearer "+apiKey)
//
//	client := &http.Client{}
//	resp, err := client.Do(req)
//	if err != nil {
//		log.Fatal("Error executing request:", err)
//	}
//	defer resp.Body.Close()
//
//	bodyBytes, err := io.ReadAll(resp.Body)
//	if err != nil {
//		log.Fatal("Error reading response body:", err)
//	}
//
//	return extractContent(string(bodyBytes))
//}
