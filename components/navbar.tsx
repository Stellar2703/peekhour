"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Search, Home, Plus, Bell, Settings, LogOut, Users } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn] = useState(true) // Mock auth state

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity"
        >
          <MapPin className="w-6 h-6" />
          <span className="hidden sm:inline">Peekhour</span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/home" isActive={isActive("/home")} icon={<Home className="w-4 h-4" />} label="Home" />
          <NavLink href="/search" isActive={isActive("/search")} icon={<Search className="w-4 h-4" />} label="Search" />
          <NavLink
            href="/departments"
            isActive={isActive("/departments")}
            icon={<Users className="w-4 h-4" />}
            label="Departments"
          />
        </div>

        {/* Right Actions */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" title="New Post">
              <Plus className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({
  href,
  isActive,
  icon,
  label,
}: { href: string; isActive: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </Link>
  )
}
