"use client";

import React from "react";
import ChessBoard from "@/components/ChessBoard";
import LLMChat from "@/components/LLMSections";
import Conversation from "@/components/Conversation";

export default function Home(){
  return (
    <div className="h-screen flex gap-2 justify-center items-center bg-[#13141E] p-4">
    <LLMChat/>
    <ChessBoard />
    <Conversation />
    </div>
  )
}