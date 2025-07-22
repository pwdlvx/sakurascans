"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "@/components/user-menu";
import { usePathname, useRouter } from "next/navigation";

interface SakuraLogoProps {
  size?: number;
}

function SakuraLogo({ size = 28 }: SakuraLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50,50)">
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(0)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(72)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(144)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(216)" />
        <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(288)" />
        <circle cx="0" cy="0" r="6" fill="#fce7f3" />
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

interface NavigationLink {
  href: string;
  label: string;
}

export function Header({ onLoginClick }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const navigationLinks: NavigationLink[] = [
    { href: "/", label: "Home" },
    { href: "/bookmarks", label: "Bookmarks" },
    { href: "/comics", label: "Comics" },
    { href: "/recruitment", label: "Recruitment" },
  ];

  const isActivePage = (path: string): boolean => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClassName = (path: string): string => {
    return isActivePage(path)
      ? "nav-link sakura-text-primary text-base"
      : "nav-link text-muted-foreground hover:text-sakura-primary text-base";
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleMobileSearchClick = () => {
    router.push('/search');
  };

  return (
    <header className="header-blur">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 sakura-button rounded-lg flex items-center justify-center sakura-glow-subtle">
              <SakuraLogo size={23} />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getLinkClassName(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" size={17} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input pl-10 pr-4 py-2 rounded-lg text-base w-60"
                />
              </form>
            </div>

            <div className="sm:hidden">
              <button
                onClick={handleMobileSearchClick}
                className="text-muted-foreground hover:text-sakura-primary transition-colors"
                aria-label="Search"
              >
                <Search size={21} />
              </button>
            </div>

            <div className="hidden md:block">
              <UserMenu onLoginClick={onLoginClick} />
            </div>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-muted-foreground hover:text-sakura-primary transition-colors"
              aria-label="Toggle mobile menu"
            >
              {showMobileMenu ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-sakura-border">
            <nav className="flex flex-col gap-4 mt-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getLinkClassName(link.href)}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
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
