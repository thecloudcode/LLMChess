interface anyParameters {
    key1: string;
    key2: number;
}

export type Agent = {
    id: string;
    name: string;
    description: string;
    model: string;
    parameters?: Record<string, anyParameters>;
}

export type ChessMove = {
    from: string;
    to: string;
    piece: string;
    captured?: string;
    promotion?: string;
}

export type GameState = {
    board: string[][];
    isWhiteTurn: boolean;
    status: 'active'|'checkmate'|'stalemate'|'draw';
    lastMove?: ChessMove
    check?: boolean;
}

export type Conversation = {
    id: string;
    agentId: string;
    agentName: string;
    color: 'white'|'black';
    message: string;
    thinking?: string;
    move?: ChessMove;
    timestamp: string;
}