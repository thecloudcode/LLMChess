"use client";

import React from "react";
import ChessBoard from "@/components/ChessBoard";
import LLMChat from "@/components/LLMSections";
import ChatArea from "../components/ChatArea";

export default function Home(){
  return (
    <div className="h-screen flex gap-2 justify-center items-center bg-white p-4">
      <LLMChat/>
      <ChessBoard />
      <ChatArea />
    </div>
  )
}