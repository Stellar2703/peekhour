"use client"

import { PostUploadCard } from "@/components/post-upload-card"
import { PostFeed } from "@/components/post-feed"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Post Upload Card */}
          <PostUploadCard />

          {/* Posts Feed */}
          <PostFeed />
        </div>
      </div>
    </main>
  )
}
