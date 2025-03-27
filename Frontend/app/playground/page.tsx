"use client";
import React, { useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import LLMChat from "@/components/LLMSections";
import ChatArea from "../components/ChatArea";

interface ChessEvent {
  type: string;
  data: Record<string, unknown>;
}

export default function Home() {
  const [sharedEvents, setSharedEvents] = useState<ChessEvent[]>([]);

  const handleAddEvent = (event: ChessEvent) => {
    setSharedEvents(prev => [...prev, event]);
  };

  const handleResetEvents = () => {
    setSharedEvents([]);
  };

  return (
    <div className="flex justify-center items-center bg-white py-5 px-2 md:px-5"
         style={{ height: 'calc(100vh - 80px)' }}> {/* Adjust 60px to your navbar height */}
      <div className="flex-[1] min-w-0 h-full">
        <LLMChat 
          sharedEvents={sharedEvents} 
          onAddEvent={handleAddEvent}
          // onResetEvents={handleResetEvents}
        />
      </div>
      <div className="flex-[1.2] min-w-0 h-full justify-center items-center">
        <ChessBoard 
          sharedEvents={sharedEvents} 
          onAddEvent={handleAddEvent}
          onResetEvents={handleResetEvents}
        />
      </div>
      <div className="flex-[1] min-w-0 h-full">
        <ChatArea />
      </div>
    </div>
  );
}