import React, { useState, useEffect, useRef } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import ReactMarkdown from 'react-markdown';

// Define event data types
interface BaseEventData {
  player?: string;
  parseError?: boolean;
  empty?: boolean;
  rawData?: string;
}

interface ResponseEventData extends BaseEventData {
  response?: string;
}

interface ReasoningEventData extends BaseEventData {
  reasoning?: string;
}

interface MoveEventData extends BaseEventData {
  move?: string;
  moveNumber?: number;
  reasoning?: string;
}

interface GameOverEventData extends BaseEventData {
  result?: string;
  moves?: string[];
  reasonings?: Record<number, string>;
}

type ChessEventData = BaseEventData | ResponseEventData | ReasoningEventData | MoveEventData | GameOverEventData;

interface ChessEvent {
  type: string;
  data?: ChessEventData;
}

type LLMTerminalProps = {
  model: string;
  events: ChessEvent[];
}

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bricolage-grotesque",
});

// Typing animation component with markdown support
const TypedContent: React.FC<{ text: string, typingSpeed?: number, onTextUpdate?: () => void }> = ({ text, typingSpeed = 20, onTextUpdate }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextCharacter, typingSpeed);
        // Call the callback whenever text updates
        if (onTextUpdate) {
          onTextUpdate();
        }
      } else {
        setIsComplete(true);
      }
    };
    
    timeoutId = setTimeout(typeNextCharacter, typingSpeed);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, typingSpeed, onTextUpdate]);
  
  return (
    <div className="whitespace-pre-wrap">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isComplete && <span className="animate-pulse">▌</span>}
    </div>
  );
};

const LLMTerminal: React.FC<LLMTerminalProps> = ({ model, events }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    // Scroll to bottom when events change
    scrollToBottom();
  }, [events]);
  
  // Filter events that are relevant to this model
  const filteredEvents = events.filter(event => {
    // Always show game-start, game-over, error events
    if (['game-start', 'game-over', 'error', 'connection-error'].includes(event.type)) {
      return true;
    }
    
    // For response, thinking, move, reasoning, and illegal-move, only show if it's for this model
    if (['response', 'thinking', 'move', 'reasoning', 'illegal-move'].includes(event.type)) {
      return event.data?.player === model;
    }
    
    // Show other events by default
    return true;
  });

  return (
    <div className={`flex flex-col h-full bg-[#eef1f5] rounded-2xl overflow-hidden shadow-lg ${bricolageGrotesque.variable} font-bricolage-grotesque text-sm`}>
      {/* Message container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            {/* <p>Waiting...</p> */}
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            // Skip empty or error events in the main display
            if (event.data?.empty || event.data?.parseError) {
              return null;
            }
            
            switch (event.type) {
              case 'response':
                const responseData = event.data as ResponseEventData;
                return (
                  <div key={index} className="flex flex-col">
                    <div className="rounded-lg p-4 shadow-sm max-w-4xl self-start">
                      <div className="font-medium text-black mb-1">
                        {responseData.player || 'AI'} 
                      </div>
                      <TypedContent 
                        text={responseData.response || 'No response'} 
                        onTextUpdate={scrollToBottom}
                      />
                    </div>
                  </div>
                );
                
              case 'reasoning':
                const reasoningData = event.data as ReasoningEventData;
                return (
                  <div key={index} className="flex flex-col">
                    <div className="rounded-lg p-4 shadow-sm max-w-4xl self-start border-l-4 border-amber-400">
                      <div className="font-medium text-amber-700 mb-1">Reasoning</div>
                      <TypedContent 
                        text={reasoningData.reasoning || 'No reasoning provided'} 
                        typingSpeed={10}
                        onTextUpdate={scrollToBottom}
                      />
                    </div>
                  </div>
                );
                
              case 'move':
                const moveData = event.data as MoveEventData;
                return (
                  <div key={index} className="flex flex-col text-gray-600 text-sm">
                    <div className="rounded-lg p-4 max-w-4xl self-start">
                      <div className="font-medium mb-1">
                        {moveData.player} Move {moveData.moveNumber && `#${moveData.moveNumber}`}
                      </div>
                      <div className="text-xl font-bold my-2">
                        <ReactMarkdown>{moveData.move || 'Unknown move'}</ReactMarkdown>
                      </div>
                      {moveData.reasoning && (
                        <div className="mt-2 rounded-md">
                          <TypedContent 
                            text={moveData.reasoning} 
                            typingSpeed={5}
                            onTextUpdate={scrollToBottom}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
                
              // case 'game-over':
              //   const gameOverData = event.data as GameOverEventData;
              //   return (
              //     <div key={index} className="flex flex-col text-gray-600">
              //       <div className="rounded-lg p-4 max-w-4xl mx-auto">
              //         <div className="font-medium text-xl mb-2 text-center">Game Over</div>
              //         <div className="text-center mb-3">
              //           Result: <span className="font-bold">{gameOverData.result || 'Unknown'}</span>
              //         </div>
              //         {gameOverData.moves && (
              //           <div className="mt-3 p-3 rounded-md">
              //             <div className="font-medium mb-2">Moves:</div>
              //             <div className="grid grid-cols-2 gap-2 text-sm">
              //               {gameOverData.moves.map((move, moveIdx) => (
              //                 <div key={moveIdx} className="flex">
              //                   <span className="mr-2 text-gray-400">{moveIdx + 1}.</span>
              //                   <span><ReactMarkdown>{move}</ReactMarkdown></span>
              //                 </div>
              //               ))}
              //             </div>
              //           </div>
              //         )}
              //       </div>
              //     </div>
              //   );
                
              case 'error':
              case 'connection-error':
                return (
                  <div key={index} className="flex flex-col">
                    <div className="bg-red-100 text-red-800 rounded-lg p-4 shadow-sm max-w-4xl mx-auto">
                      <div className="font-medium mb-1">Error</div>
                      <div>{JSON.stringify(event.data)}</div>
                    </div>
                  </div>
                );
                
              default:
                return null;
            }
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Status bar */}
      <div className="px-4 py-2 text-xs text-gray-600 flex justify-between items-center">
        <div>Connected to {model}</div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
};

export default LLMTerminal;