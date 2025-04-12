```
flowchart TD
subgraph Frontend
User[User/Client]
end

    subgraph Backend
        API[API Handler<br>StockfishLLMHandler]
        
        subgraph StockfishModule[Stockfish Module]
            FindBestMove[FindBestMove<br>Analyzes position]
            Research[Research<br>Calculates 5 future moves]
            StockfishEngine[Stockfish Chess Engine]
        end
        
        subgraph LLMModule[LLM Module]
            PromptBuilder[Prompt Builder]
            LLM_API[LLM API Client]
            LLM_Service[LLM Service<br>OpenAI/Llama]
        end
    end
    
    User -->|POST /api/chess<br>moves: ["e2e4", "e7e5", ...]| API
    API -->|Pass moves| FindBestMove
    FindBestMove -->|Command execution| StockfishEngine
    StockfishEngine -->|"bestmove e2e4"| FindBestMove
    API -->|Pass moves| Research
    Research -->|Multiple calls| FindBestMove
    FindBestMove -->|Best moves| Research
    
    API -->|Generate prompt with:<br>- Current position<br>- Best move<br>- Future line| PromptBuilder
    PromptBuilder -->|Formatted prompt| LLM_API
    LLM_API -->|API request| LLM_Service
    LLM_Service -->|Response with explanation| LLM_API
    LLM_API -->|Explanation text| API
    
    API -->|JSON response:<br>- Best move<br>- Future line<br>- LLM explanation| User

    classDef usernode fill:#f9f,stroke:#333,stroke-width:2px
    classDef stockfish fill:#a5d8ff,stroke:#333,stroke-width:1px
    classDef llm fill:#b9f6ca,stroke:#333,stroke-width:1px
    classDef api fill:#ffecb3,stroke:#333,stroke-width:1px
    
    class User usernode
    class FindBestMove,Research,StockfishEngine stockfish
    class PromptBuilder,LLM_API,LLM_Service llm
    class API api
```