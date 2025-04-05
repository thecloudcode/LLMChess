# LLMChess ♟️

![GamePlay.png](GamePlay.png)


**LLMChess** is an AI-powered chess platform where two language models play against each other. It allows users to interact with the models and influence their moves in real-time. The project integrates the power of traditional chess engines and modern large language models to create an interactive, intelligent chess experience.

## Tech Stack

- **Backend**: Golang
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **AI Integration**: 
  - Custom `StockfishLLM` using Stockfish Chess Engine
  - LLama-based language model for natural language interaction and decision-making

## Features

- Users can chat with the LLM and influence move decisions
- LLM vs LLM gameplay
- StockfishLLM`: A hybrid model combining classic chess logic with natural language reasoning
- Modern, responsive UI built with Next.js and Tailwind CSS

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/LLMChess.git
   cd LLMChess
   ```

2. **Start the backend server (Golang):**
   ```bash
   cd Backend
   go run main.go
   ```

3. **Start the frontend (Next.js):**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

4. **Make sure Stockfish and LLama models are configured correctly as per `StockfishLLM` requirements.**
