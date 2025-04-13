import Link from "next/link"
import { Github, Linkedin, ArrowRight } from "lucide-react"
import { League_Spartan } from "next/font/google"
import { Bricolage_Grotesque } from "next/font/google"
import { auth, signOut, signIn } from "../auth"
import NavLinks from "./NavBarLinks"

const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], 
    variable: "--font-league-spartan",
})
  

const bricolageGrotesque = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-bricolage-grotesque",
})

const Navbar = async () => {
  const session = await auth()

  const navItems = [
    { name: "HOME", href: "/" },
    { name: "STOCKFISH LLM", href: "/stockfishllm" },
    { name: "PLAYGROUND", href: "/playground" },
  ]

  return (
    <header className="relative w-full h-[80px] py-5 px-5 md:px-5 flex items-center justify-between bg-white">
      
      <Link href="/" className={`${leagueSpartan.className} flex items-center w-[140px]`}>
        <div className="font-bold text-2xl -space-y-1.5">
          <span className="block leading-none text-black">LLM</span>
          <span className="block leading-none text-black">CHESS</span>
        </div>
      </Link>

      
      <div className={`${bricolageGrotesque.className} absolute left-1/2 transform -translate-x-1/2`}>
      <NavLinks items={navItems}/>
      </div>

      
      <div className={`${bricolageGrotesque.className} flex items-center gap-2`}>
        <div className="flex gap-3 right-3">
        <Link href="https://linkedin.com/in/badalprasadsingh/" aria-label="LinkedIn" className="text-slate-700 hover:text-slate-900">
          <Linkedin className="h-4 w-4" />
        </Link>
        <Link href="https://github.com/thecloudcode/LLMChess/" aria-label="GitHub" className="text-slate-700 hover:text-slate-900 ">
          <Github className="h-4 w-4" />
        </Link>
        </div>

        {session && session?.user ? (
          <>
          <span className="font-extrabold text-sm text-black px-3">
          {session?.user?.name}
          </span>
          <form action={async () => {
            "use server";
            await signOut({redirectTo: "/"})
          }}>
          <button type="submit" className="flex items-center font-extrabold text-sm text-black px-3 gap-3">
          Logout
          <ArrowRight className="h-5 w-5 text-white bg-black rounded-4xl p-1 stroke-4 stroke-white" />
          </button>
          </form>
          </>
        ) : (
          <form action={ async() => {
            "use server";
            await signIn('google')
          }}>
          <button type="submit" className="flex items-center font-extrabold text-sm text-black px-3 gap-3">
          Login
            <ArrowRight className="h-5 w-5 text-white bg-black rounded-4xl p-1 stroke-4 stroke-white" />
          </button>
          </form>
        )}
        

      </div>
    </header>
  )
}

export default Navbar