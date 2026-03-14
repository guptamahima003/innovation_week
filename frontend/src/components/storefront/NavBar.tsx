"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Wifi, WifiOff } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { PERSONA_COLORS, PERSONA_ICONS, PERSONA_LABELS } from "@/lib/constants";
import SearchBar from "./SearchBar";

interface NavBarProps {
  onSearch?: (query: string) => void;
}

export default function NavBar({ onSearch }: NavBarProps) {
  const { session, cartItemCount, wsConnected } = useApp();

  const personaType = session?.persona_type ?? "tech_enthusiast";
  const personaColor = PERSONA_COLORS[personaType] ?? "#6366f1";
  const personaIcon = PERSONA_ICONS[personaType] ?? "🤖";
  const personaLabel = PERSONA_LABELS[personaType] ?? personaType;

  return (
    <nav className="sticky top-0 z-50 bg-[#0046BE] shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-[#FFE000] font-extrabold text-2xl tracking-tight">
              Best Buy
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-white text-sm font-medium">
            <Link href="/" className="hover:text-[#FFE000] transition-colors">
              Home
            </Link>
            <Link href="/" className="hover:text-[#FFE000] transition-colors">
              Products
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* WS indicator */}
            <div title={wsConnected ? "Connected" : "Disconnected"}>
              {wsConnected ? (
                <Wifi className="w-4 h-4 text-green-300" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-300" />
              )}
            </div>

            {/* Persona badge */}
            {session && (
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/20"
                style={{ backgroundColor: personaColor }}
              >
                <span>{personaIcon}</span>
                <span>{personaLabel}</span>
              </div>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1 text-white hover:text-[#FFE000] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FFE000] text-[#0046BE] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBar onSearch={onSearch} />
      </div>
    </nav>
  );
}
