import React, { useState } from "react";
import ChessPiece from "./ChessPiece";
import { movePiece } from "@/utils/chess";

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const ChessBoard: React.FC = () => {
  const [boardState, setBoardState] = useState(initialBoard);
  // const [selectedPiece, setSelectedPiece] = useState<{row: Number, col: number} | null>(null);

  const [capturedByPlayer, setCapturedByPlayer] = useState<string[]>([]);
  const [capturedByOpponent, setCapturedByOpponent] = useState<string[]>([]);
  const [playerScore, setPlayerScore] = useState("Score");
  const [opponentScore, setOpponentScore] = useState("Score");

  const handleDrop = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData('piece'));
    const {row: fromRow, col: fromCol} = data;
    if (fromRow === toRow && fromCol === toCol) return;
    if (boardState[fromRow][fromCol] === ' ') return;

    const pieceBeingCaptured = boardState[toRow][toCol];

    const newBoard = movePiece(boardState, fromRow, fromCol, toRow, toCol);

    if (pieceBeingCaptured !== ' ') {
      if (pieceBeingCaptured === pieceBeingCaptured.toLowerCase()) {
        
        setCapturedByPlayer([...capturedByPlayer, pieceBeingCaptured]);
        setPlayerScore(playerScore + getPieceValue(pieceBeingCaptured));
      } else {
        
        setCapturedByOpponent([...capturedByOpponent, pieceBeingCaptured]);
        setOpponentScore(opponentScore + getPieceValue(pieceBeingCaptured));
      }
    }

    setBoardState(newBoard);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  const getPieceValue = (piece: string) => {
    switch (piece.toLowerCase()) {
      case 'p': return 1; 
      case 'n': return 3; 
      case 'b': return 3; 
      case 'r': return 5; 
      case 'q': return 9; 
      case 'k': return 0; 
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white py-4 px-10 h-screen">
      <div className="w-full max-w-[90vmin] flex justify-between items-center px-4">
        <div className="text-white">
          <div className="text-lg font-bold">{playerScore}</div>
          <div className="flex">
            {capturedByPlayer.map((piece, index) => (
              <div key={index} className="text-white text-2xl mx-1">
                {piece}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[84vmin] h-full max-h-[84vmin] aspect-square shadow-2xl border-4 border-[#13141E]">
        {boardState.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLightSquare = (rowIndex + colIndex) % 2 === 0;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex items-center justify-center 
                  ${isLightSquare ? "bg-[#2F3241]" : "bg-[#13141E]"}`}
                onDrop={(e)=>handleDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
              >
                {piece !== ' ' && (
                  <ChessPiece
                    key={`${rowIndex}-${colIndex}-piece`}
                    piece={piece}
                    row={rowIndex}
                    col={colIndex}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="w-full max-w-[90vmin] flex justify-between items-center px-4">
        <div className="text-white">
          <div className="text-lg font-bold">{opponentScore}</div>
          <div className="flex mt-2">
            {capturedByOpponent.map((piece, index) => (
              <div key={index} className="text-white text-2xl mx-1">
                {piece}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
