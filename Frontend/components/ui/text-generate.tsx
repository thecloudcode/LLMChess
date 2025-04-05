"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      "p, li, strong, em, code, h1, h2, h3, h4, h5, h6",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration,
        delay: stagger(0.2),
      }
    );
  }, [scope.current]);

  return (
    <div className={cn("", className)}>
      <div className="mt-4">
        <motion.div
          ref={scope}
          className="text-black text-sm leading-snug tracking-wide space-y-2"
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <motion.p className="opacity-0" style={{ filter: "blur(10px)" }}>
                  {children}
                </motion.p>
              ),
              strong: ({ children }) => (
                <motion.strong className="font-bold opacity-0" style={{ filter: "blur(10px)" }}>
                  {children}
                </motion.strong>
              ),
              em: ({ children }) => (
                <motion.em className="italic opacity-0" style={{ filter: "blur(10px)" }}>
                  {children}
                </motion.em>
              ),
              li: ({ children }) => (
                <motion.li className="ml-4 list-disc opacity-0" style={{ filter: "blur(10px)" }}>
                  {children}
                </motion.li>
              ),
              code: ({ children }) => (
                <motion.code className="bg-gray-100 px-1 rounded opacity-0" style={{ filter: "blur(10px)" }}>
                  {children}
                </motion.code>
              ),
            }}
          >
            {words}
          </ReactMarkdown>
        </motion.div>
      </div>
    </div>
  );
};
