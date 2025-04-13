"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

interface NavItem {
  name: string;
  href: string;
}

interface NavLinksProps {
  items: NavItem[];
}

const NavLinks: React.FC<NavLinksProps> = ({ items }) => {
  const pathname = usePathname()
  
  return (
    <nav className="hidden md:flex items-center gap-2">
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={
            pathname === item.href
              ? "px-5 py-2 rounded-full text-sm font-medium transition-colors bg-slate-200 text-slate-800 border-1 border-slate-300"
              : "px-5 py-2 rounded-full text-sm font-medium transition-colors hover:bg-slate-100 text-black border-1 border-slate-300"
          }
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}

export default NavLinks