// types/chat.ts
export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'llama' | 'deepseek';
    timestamp: Date;
  }
  
  export type AIProvider = 'llama' | 'deepseek';