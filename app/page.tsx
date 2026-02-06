"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Share2, MessageSquare } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect to home if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/home")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
            Discover Events{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">by Location</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Share photos, videos, and moments from your area. Connect with your community through location-based events
            and discoveries.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => router.push("/signup")} className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/search")}>
              Browse Events
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MapPin className="w-8 h-8" />}
            title="Location-Based Discovery"
            description="Find events, photos, and moments happening at specific locations with detailed geographic filtering."
          />
          <FeatureCard
            icon={<Share2 className="w-8 h-8" />}
            title="Share Everything"
            description="Upload photos, videos, audio, and text to share what's happening around you right now."
          />
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Connect & Engage"
            description="Comment, react with thanks, and share content with your community effortlessly."
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
