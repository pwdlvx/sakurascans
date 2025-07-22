"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "@/components/user-menu";
import { usePathname } from "next/navigation";

function SakuraLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50,50)">
        {/* Sakura petals - 5 petals in a circle */}
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(0)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(72)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(144)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(216)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(288)" />
        <circle cx="0" cy="0" r="6" fill="#fce7f3" />
        {/* Center stamens */}
        <circle cx="0" cy="-3" r="1" fill="#f472b6" />
        <circle cx="2.8" cy="-0.9" r="1" fill="#f472b6" />
        <circle cx="1.7" cy="2.4" r="1" fill="#f472b6" />
        <circle cx="-1.7" cy="2.4" r="1" fill="#f472b6" />
        <circle cx="-2.8" cy="-0.9" r="1" fill="#f472b6" />
      </g>
    </svg>
  );
}

interface HeaderProps {
  onLoginClick: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

  const isActivePage = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClassName = (path: string) => {
    return isActivePage(path)
      ? "nav-link sakura-text-primary text-base"
      : "nav-link text-muted-foreground hover:text-sakura-primary text-base";
  };

  return (
    <header className="header-blur">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 sakura-button rounded-lg flex items-center justify-center sakura-glow-subtle">
              <SakuraLogo size={23} />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={getLinkClassName("/")}>Home</Link>
            <Link href="/bookmarks" className={getLinkClassName("/bookmarks")}>Bookmarks</Link>
            <Link href="/comics" className={getLinkClassName("/comics")}>Comics</Link>
            <Link href="/recruitment" className={getLinkClassName("/recruitment")}>Recruitment</Link>
          </nav>

          {/* Search and User Menu */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type="text"
                placeholder="Search"
                className="search-input pl-10 pr-4 py-2 rounded-lg text-base w-60"
              />
            </div>
            <div className="sm:hidden">
              <Search className="text-muted-foreground cursor-pointer" size={21} />
            </div>
            <div className="hidden md:block">
              <UserMenu onLoginClick={onLoginClick} />
            </div>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-muted-foreground hover:text-sakura-primary transition-colors"
            >
              {showMobileMenu ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-sakura-border">
            <nav className="flex flex-col gap-4 mt-4">
              <Link href="/" className={getLinkClassName("/")}>Home</Link>
              <Link href="/bookmarks" className={getLinkClassName("/bookmarks")}>Bookmarks</Link>
              <Link href="/comics" className={getLinkClassName("/comics")}>Comics</Link>
              <Link href="/recruitment" className={getLinkClassName("/recruitment")}>Recruitment</Link>
              <div className="pt-2 border-t border-sakura-border">
                <UserMenu onLoginClick={onLoginClick} />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
