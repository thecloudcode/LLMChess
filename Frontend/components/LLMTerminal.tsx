import React from "react";
import { Bricolage_Grotesque } from "next/font/google"

interface ChessEvent {
  type: string;
  data: any;
}

type LLMTerminalProps = {
  model: string;
  events: ChessEvent[];
}

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bricolage-grotesque",
})

const LLMTerminal: React.FC<LLMTerminalProps> = ({ model, events }) => {
  // Filter events that are relevant to this model
  const filteredEvents = events.filter(event => {
    // Always show game-start, game-over, error events
    if (['game-start', 'game-over', 'error', 'connection-error'].includes(event.type)) {
      return true;
    }
    
    // For response, thinking, move, and illegal-move, only show if it's for this model
    if (['response', 'thinking', 'move', 'illegal-move'].includes(event.type)) {
      return event.data?.player === model;
    }
    
    // Show other events by default
    return true;
  });

  return (
    <div className="p-2 text-black bg-[#EEF1F5] text-lg h-full rounded-2xl">

      <div className="mb-4">
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500"></p>
        ) : (
          filteredEvents.map((event, index) => (
            <div key={index} className="mb-4 p-2 border-b">
              <div className="text-sm">{event.type}</div>
              {event.data?.parseError && (
                <div className=" p-2 my-1 rounded">
                  <strong>Parse Error:</strong> Failed to parse event data
                  {event.data?.rawData && (
                    <div className="mt-1 text-xs overflow-x-auto">
                      Raw: {event.data.rawData}
                    </div>
                  )}
                </div>
              )}
              {event.data?.empty && (
                <div className=" p-2 my-1 rounded">
                  <strong>Empty Data:</strong> Event contained no data
                </div>
              )}
              {event.type === 'response' && !event.data?.parseError && !event.data?.empty && (
                <div className=" p-2 my-1 rounded">
                  <strong>{event.data.player || 'Player'}:</strong> {event.data.response || 'No response'}
                </div>
              )}
              {event.type === 'move' && !event.data?.parseError && !event.data?.empty && (
                <div className=" p-2 my-1 rounded text-sm">
                  <span className="text-sm">Move:</span> {event.data.move || 'Unknown'} 
                  {event.data.moveNumber && <span className="text-sm"> (Move #{event.data.moveNumber})</span>}
                </div>
              )}
              {event.type === 'game-over' && !event.data?.parseError && !event.data?.empty && (
                <div className="my-1 rounded text-sm">
                  <span>Result:</span> {event.data.result || 'Unknown'}
                  {event.data.moves && (
                    <div className="mt-2">
                      <span>Moves:</span> {event.data.moves.join(', ')}
                    </div>
                  )}
                </div>
              )}
              {event.type !== 'response' && 
                event.type !== 'move' && 
                event.type !== 'game-over' && 
                !event.data?.parseError && 
                !event.data?.empty && (
                <pre className="text-sm  p-2 overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LLMTerminal;