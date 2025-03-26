"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Github, Linkedin, ArrowRight } from "lucide-react"
import { League_Spartan } from "next/font/google"
import { Bricolage_Grotesque } from "next/font/google"

const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], // Bold weight
    variable: "--font-league-spartan",
})
  
  // Configure Bricolage Grotesque for navigation
const bricolageGrotesque = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-bricolage-grotesque",
})

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: "HOME", href: "/" },
    { name: "STOCKFISH LLM", href: "/stockfish-llm" },
    { name: "PLAYGROUND", href: "/playground" },
    { name: "DOCS", href: "/docs" },
    { name: "PRICING", href: "/pricing" },
  ]

  return (
    <header className="w-full py-10 px-6 md:px-12 flex items-center justify-between bg-white">
      {/* Logo */}
      <Link href="/" className={`${leagueSpartan.className} flex items-center`}>
        <div className="font-bold text-3xl -space-y-1.5">
          <span className="block leading-none text-black">LLM</span>
          <span className="block leading-none text-black">CHESS</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className={`${bricolageGrotesque.className} hidden md:flex items-center gap-2`}>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={
              pathname === item.href
                ? "px-9 py-3 rounded-full text-lg font-medium transition-colors bg-slate-200 text-slate-800 border-1  border-slate-300"
                : "px-9 py-3 rounded-full text-lg font-medium transition-colors hover:bg-slate-100 text-black border-1 border-slate-300"
            }
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Social Links and Login */}
      <div className={`${bricolageGrotesque.className} flex items-center gap-12`}>
        <div className="flex gap-6 right-3">
        <Link href="https://linkedin.com" aria-label="LinkedIn" className="text-slate-700 hover:text-slate-900">
          <Linkedin className="h-6 w-6" />
        </Link>
        <Link href="https://github.com" aria-label="GitHub" className="text-slate-700 hover:text-slate-900 ">
          <Github className="h-6 w-6" />
        </Link>
        </div>
        <Link href="/login" className="flex items-center font-extrabold text-lg text-black px-3 gap-3">
          LOGIN
          <ArrowRight className="h-8 w-8 text-white bg-black rounded-4xl p-1 stroke-4 stroke-white" />
        </Link>
      </div>
    </header>
  )
}

