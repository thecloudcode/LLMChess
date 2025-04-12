import React from 'react';

interface PlayerInfoProps {
  whitePlayer: string;
  blackPlayer: string;
  currentPlayer: string;
  status: 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'error';
  winner?: string;
}

export default function PlayerInfo({ 
  whitePlayer, 
  blackPlayer, 
  currentPlayer, 
  status, 
  winner 
}: PlayerInfoProps): React.ReactElement {
  return (
    <div className="flex-1">
      <div className="space-y-4">
        <div className="flex items-center p-2 rounded-md">
          <div className="w-6 h-6 bg-white border border-gray-300 rounded-full mr-3"></div>
          <div className="flex-1">
            <p className="font-semibold text-gray-700">{whitePlayer}</p>
          </div>
          {currentPlayer === whitePlayer && status === 'in_progress' && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Current turn"></div>
          )}
        </div>
        
        <div className="flex items-center p-2 rounded-md">
          <div className="w-6 h-6 bg-gray-800 border border-gray-300 rounded-full mr-3"></div>
          <div className="flex-1">
            <p className="font-semibold text-gray-700">{blackPlayer}</p>
          </div>
          {currentPlayer === blackPlayer && status === 'in_progress' && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Current turn"></div>
          )}
        </div>
        
        {status !== 'in_progress' && (
          <div className="mt-4 p-3 text-sm rounded-md pt-20">
            <h3 className="font-semibold text-lg text-gray-700">Game Over</h3>
            <p className="text-gray-600">
              {status === 'checkmate' && `${winner} wins by checkmate!`}
              {status === 'stalemate' && 'Game ended in stalemate.'}
              {status === 'draw' && 'Game ended in draw.'}
              {status === 'error' && `Game ended due to error. ${winner ? winner + ' wins!' : ''}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}