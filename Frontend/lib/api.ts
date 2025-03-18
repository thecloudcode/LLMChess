import { Agent, GameState, Conversation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL;

export async function fetchAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_URL}/agents`);

    if(!response.ok){
        throw new Error('Failed to fetch agents');
    }

    return response.json();
}