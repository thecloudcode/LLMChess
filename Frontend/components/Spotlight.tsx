"use client";
import React from "react";
import { Spotlight } from "@/components/ui/spotlight-new";

export function SpotlightNewDemo() {
  return (
    <div className="h-[40rem] w-full flex bg-white antialiased bg-grid-black/[0.02] relative overflow-hidden pt-32">
      {/* <Spotlight /> */}
      <div className="p-4 max-w-7xl mx-auto relative z-10 w-full">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600 bg-opacity-50">
          LLMCHESS
        </h1>
        <p className="mt-4 font-normal text-base text-neutral-700 max-w-2xl text-center mx-auto">
        An advanced AI-powered chess game where two large language models (LLMs) compete in real-time, showcasing their strategic thinking and decision-making capabilities
        </p>
      </div>
    </div>
  );
}
