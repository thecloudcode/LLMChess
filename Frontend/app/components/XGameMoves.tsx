"use client"
import React, { useRef, useEffect } from 'react';

interface MoveRecord {
  player: string;
  move: string;
  reasoning: string;
  response: string;
  timestamp: string;
}

interface GameMovesProps {
  moves: MoveRecord[];
}

export default function GameMoves({ moves }: GameMovesProps): React.ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [moves]);
  
  if (!moves || moves.length === 0) {
    return (
      <div className="bg-[#EEF2F5] p-4 rounded-lg shadow-md h-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-500">Moves</h2>
        <p className="text-gray-500 italic">No moves yet</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#EEF2F5] p-4 rounded-lg max-h-124 h-full flex flex-col text-left">
      {/* <h2 className="text-xl font-semibold mb-4">Moves</h2> */}
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {moves.map((move, index) => (
          <div key={index} className="pb-3">
            <div className="flex items-center mb-1 text-gray-500 font-semibold">
              <span className="font-semibold">{move.player}</span>
              <span className="text-sm text-gray-500">
                 {index % 2 === 0 ? ' (White)' : ' (Black)'}
              </span>
            </div>
            
            <div className="bg-[#EEF2F5] rounded mb-2 text-gray-500 font-semibold">
              <p className="font-mono text-lg">{move.move}</p>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-medium">Reasoning:</span> {move.reasoning}
            </p>
            
            {move.response && (
              <p className="text-sm text-gray-500 font-semibold">
                {move.response}
              </p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}