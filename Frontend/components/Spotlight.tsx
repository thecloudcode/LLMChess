"use client";
import React from "react";
import Image from "next/image";
import { League_Spartan } from "next/font/google"
import Link from "next/link";
import Herotop from "@/components/herotop";


const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], 
    variable: "--font-league-spartan",
})
  

export function SpotlightNewDemo() {
return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden px-4 py-16">
        <Herotop/>

    <div className="max-w-4xl w-full text-center z-10 pb-20 pt-10">
        <h1 className={`${leagueSpartan.className} text-7xl md:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600`}>
        LLMCHESS
        </h1>
        <p className="mt-4 text-base md:text-lg text-neutral-700 mb-10">
        An advanced AI-powered chess game where two large language models (LLMs) compete in real-time, showcasing their strategic thinking and decision-making capabilities.
        </p>
        <div className="flex flex-row justify-center items-center gap-2">

        <Link href={"./stockfishllm"}>
    <button className="bg-slate-800 no-underline group cursor-pointer relative shadow-3xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6  text-white inline-block">
  <span className="absolute inset-0 overflow-hidden rounded-full">
    <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
  </span>
  <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-2 px-5 ring-1 ring-white/10 ">
    <span>
      Stockfish LLM
    </span>
    <svg
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.75 8.75L14.25 12L10.75 15.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  </div>
  
  <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
</button>
</Link>
        <Link href={"./playground"}>
    <button className="bg-slate-800 no-underline group cursor-pointer relative shadow-3xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6  text-white inline-block">
  <span className="absolute inset-0 overflow-hidden rounded-full">
    <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
  </span>
  <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-2 px-5 ring-1 ring-white/10 ">
    <span>
      Playground
    </span>
    <svg
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.75 8.75L14.25 12L10.75 15.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  </div>
  
  <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
</button>
</Link>


</div>
        
    </div>
    
    <div className="relative flex justify-center items-center mt-20">
  {/* Glow Effect */}
  <div className="absolute w-[90%] h-[90%] bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 blur-3xl opacity-50 rounded-xl z-0" />
  
  
  <Image
    src="/chessboard.png"
    alt="Chess"
    width={1000}
    height={1000}
    className="w-full border-1 border-black relative z-10 rounded-xl"
  />
</div>

<p className="mt-20 text-base md:text-lg text-neutral-700 mb-10">
        Powered by
        </p>

        <div className="flex flex-row justify-center items-center">
            <Image src="/stockfish.png" alt="Stockfish" width={90} height={90}/>
            <h1 className={`${leagueSpartan.className} text-5xl md:text-8xl lg:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600 mt-2`}>
        STOCKFISHLLM
        </h1>

        
        </div>
        <p className="mt-10 text-base md:text-lg text-neutral-700 mb-10 w-full text-center px-2">
        Integrating Stockfish with a Large Language Model to create an AI that understands, explains, and plays chess with human-like reasoning
        </p>
        {/* <div className="relative flex justify-center items-center mt-20"> */}

  {/* <div className="absolute w-[90%] h-[90%] bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 blur-3xl opacity-50 rounded-xl z-0" />
  
  
  <Image
    src="/StockfishLLM.png"
    alt="Chess"
    width={1000}
    height={1000}
    className="w-full border-1 border-black relative z-10 rounded-xl"
  />
</div>

         */}
    </div>
);
}
