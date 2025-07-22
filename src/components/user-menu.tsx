"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, BookOpen, Settings, LogOut, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface UserMenuProps {
  onLoginClick: () => void;
}

export function UserMenu({ onLoginClick }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function updatePosition() {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    if (isOpen) {
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 text-muted-foreground hover:text-sakura-primary transition-colors"
      >
        <User size={17} />
        <span className="hidden sm:inline body-font text-base">Login</span>
      </button>
    );
  }

  return (
    <div className="relative z-[99999]" ref={menuRef} data-user-menu>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-secondary rounded-lg p-2 transition-colors"
      >
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.username}
            width={34}
            height={34}
            className="rounded-full"
          />
        ) : (
          <div className="w-9 h-9 bg-sakura-primary rounded-full flex items-center justify-center">
            <User size={17} className="text-white" />
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-1">
            <span className="text-base font-medium body-font">{user.username}</span>
            {user.role === 'admin' && (
              <Crown size={13} className="text-sakura-accent" />
            )}
          </div>
          <span className="text-sm text-muted-foreground capitalize">{user.role}</span>
        </div>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed w-64 asura-card rounded-lg shadow-lg z-[999999] sakura-glow-subtle pointer-events-auto"
          style={{
            position: 'fixed',
            zIndex: 999999,
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
          data-user-menu-dropdown
        >
          <div className="p-4 border-b border-sakura-border">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
              ) : (
                <div className="w-[50px] h-[50px] bg-sakura-primary rounded-full flex items-center justify-center">
                  <User size={21} className="text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold body-font">{user.username}</span>
                  {user.role === 'admin' && (
                    <Crown size={15} className="text-sakura-accent" />
                  )}
                </div>
                <p className="text-base text-muted-foreground">{user.email}</p>
                <p className="text-sm text-sakura-accent capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <a
              href="/bookmarks"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors w-full text-left cursor-pointer"
            >
              <BookOpen size={17} className="text-sakura-primary" />
              <div>
                <span className="font-medium body-font">Bookmarks</span>
                <p className="text-sm text-muted-foreground">{user.bookmarks.length} saved</p>
              </div>
            </a>

            <a
              href="/profile"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors w-full text-left cursor-pointer"
            >
              <Settings size={17} className="text-muted-foreground" />
              <span className="font-medium body-font">Settings</span>
            </a>

            {user.role === 'admin' && (
              <a
                href="/admin"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors w-full text-left cursor-pointer"
              >
                <Shield size={17} className="text-sakura-primary" />
                <span className="font-medium body-font">Admin Panel</span>
              </a>
            )}

            <div className="border-t border-sakura-border my-2"></div>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left cursor-pointer"
            >
              <LogOut size={17} />
              <span className="font-medium body-font">Logout</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
