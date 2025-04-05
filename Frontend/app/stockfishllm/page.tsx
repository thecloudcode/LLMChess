"use client";

import React, {useState} from 'react'
import { League_Spartan } from "next/font/google"
import Image from "next/image";
import { PlaceholdersAndVanishInput } from '@/components/ui/stockfishinput';
import { TextGenerateEffect } from '@/components/ui/text-generate';

const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], 
    variable: "--font-league-spartan",
})

const STOCKFISHLLMAPIURL = process.env.NEXT_PUBLIC_STOCKFISHLLMAPIURL


function PlaceholdersAndVanishInputDemo() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    };

    const placeholders = [
      "e2e4 e7e5",
      "d2d4 d7d5 c2c4 e7e6",
      "c2c4 e7e5 b1c3 g8f6 g2g3 d7d5"
    ];
   
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setResponse(null);

      try{
        const movesArray = input.trim().split(/\s+/);
        console.log(STOCKFISHLLMAPIURL);

        const res = await fetch(`${STOCKFISHLLMAPIURL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({moves: movesArray}),
        });

        const data = await res.json();
        setResponse(data.explanation || "No response from API.");
      } catch (err) {
        console.error("API error", err);
        setResponse("Something went wrong.");
      }
      setLoading(false);
      
    };
    return (
      <div className="flex flex-col justify-center  items-center px-4 w-[60%]">

        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleChange}
          onSubmit={onSubmit}
        />
        {loading && <p className="mt-4 text-gray-600">Thinking... 🤔</p>}

        {response && (
          <div className='mt-10 bg-white p-6'>
            <TextGenerateEffect words={response}/>
          </div>
        )}

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
