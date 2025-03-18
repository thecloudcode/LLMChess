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
  const [selectedPiece, setSelectedPiece] = useState<{row: Number, col: number} | null>(null);

  const handleDrop = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData('piece'));
    const {row: fromRow, col: fromCol} = data;
    if (fromRow === toRow && fromCol === toCol) return;
    if (boardState[fromRow][fromCol] === ' ') return;

    const newBoard = movePiece(boardState, fromRow, fromCol, toRow, toCol);
    setBoardState(newBoard);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  return (
    <div className="flex flex-col items-center justify-center bg-[#888FA1] p-4 h-screen">
      
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[90vmin] h-full max-h-[90vmin] aspect-square shadow-2xl border-4 border-white">
        {boardState.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLightSquare = (rowIndex + colIndex) % 2 === 0;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex items-center justify-center 
                  ${isLightSquare ? "bg-[#E8EDF9]" : "bg-[#B7C0D8]"}`}
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
    </div>
  );
};

export default ChessBoard;
