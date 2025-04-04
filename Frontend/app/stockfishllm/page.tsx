"use client";

import React from 'react'
import { League_Spartan } from "next/font/google"
import Image from "next/image";
import { PlaceholdersAndVanishInput } from '@/components/ui/stockfishinput';

const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], 
    variable: "--font-league-spartan",
})

function PlaceholdersAndVanishInputDemo() {
    const placeholders = [
      "Paste the Chess Moves",
      "Ask a question",
    ];
   
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(e.target.value);
    };
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("submitted");
    };
    return (
      <div className="flex flex-col justify-center  items-center px-4">

        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleChange}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

const stockfishllm = () => {
  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden px-4 py-16'>
      <div className="flex flex-row justify-center items-center">
            <Image src="/stockfish.png" alt="Stockfish" width={100} height={100}/>
            <h1 className={`${leagueSpartan.className} text-7xl md:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600 mt-2`}>
        STOCKFISHLLM
        </h1>

        
        </div>
        <p className="mt-10 text-base md:text-lg text-neutral-700 mb-10 w-2xl text-center">
        Integrating Stockfish with a Large Language Model to create an AI that understands, explains, and plays chess with human-like reasoning
        </p>

        <PlaceholdersAndVanishInputDemo/>        
    </div>
  )
}

export default stockfishllm
