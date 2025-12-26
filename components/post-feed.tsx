"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Share2, Download, ZoomIn, Zap } from "lucide-react"
import { PostDetailsModal } from "./post-details-modal"

interface Post {
  id: string
  author: string
  username: string
  avatar: string
  location: string
  date: string
  department: string
  content: string
  mediaType: "photo" | "video" | "audio"
  mediaUrl: string
  likes: number
  comments: number
  shares: number
}

const mockPosts: Post[] = [
  {
    id: "1",
    author: "Sarah Johnson",
    username: "@sarahjohn",
    avatar: "SJ",
    location: "Mylapore, Chennai",
    date: "Today",
    department: "City Events",
    content: "Amazing sunset view from Marina Beach! The colors today were incredible.",
    mediaType: "photo",
    mediaUrl: "/sunset-beach-marina.jpg",
    likes: 342,
    comments: 28,
    shares: 15,
  },
  {
    id: "2",
    author: "Raj Kumar",
    username: "@rajkumar",
    avatar: "RK",
    location: "Indiranagar, Bangalore",
    date: "2 hours ago",
    department: "Tech Meetup",
    content: "Great tech meetup happening right now. Lots of interesting discussions on AI and web development!",
    mediaType: "video",
    mediaUrl: "/tech-meetup-discussion.jpg",
    likes: 156,
    comments: 42,
    shares: 8,
  },
]

export function PostFeed() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [sharedPosts, setSharedPosts] = useState<Set<string>>(new Set())

  const handleLike = (postId: string) => {
    const newLiked = new Set(likedPosts)
    if (newLiked.has(postId)) {
      newLiked.delete(postId)
    } else {
      newLiked.add(postId)
    }
    setLikedPosts(newLiked)
  }

  const handleShare = (postId: string) => {
    const newShared = new Set(sharedPosts)
    if (newShared.has(postId)) {
      newShared.delete(postId)
    } else {
      newShared.add(postId)
    }
    setSharedPosts(newShared)
  }

  return (
    <>
      <div className="space-y-4">
        {mockPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">{post.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.username}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>

              {/* Location & Department */}
              <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                <span>📍 {post.location}</span>
                <span>🏢 {post.department}</span>
              </div>

              {/* Content */}
              <p className="text-sm mb-3">{post.content}</p>

              {/* Media */}
              <div
                className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center group cursor-pointer"
                onClick={() => setSelectedPostId(post.id)}
              >
                <img
                  src={post.mediaUrl || "/placeholder.svg"}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
                  title="Zoom image"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </div>

              {/* Interactions */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 border-b border-border pb-3">
                <span>{post.likes} thanks</span>
                <span>{post.comments} comments</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="ghost"
                  className={`gap-2 bg-transparent ${likedPosts.has(post.id) ? "text-destructive" : "text-muted-foreground hover:text-primary"}`}
                  size="sm"
                  onClick={() => handleLike(post.id)}
                >
                  <Zap className={`w-4 h-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline text-xs">Thanks</span>
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 bg-transparent text-muted-foreground hover:text-primary"
                  size="sm"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Comment</span>
                </Button>
                <Button
                  variant="ghost"
                  className={`gap-2 bg-transparent ${sharedPosts.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  size="sm"
                  onClick={() => handleShare(post.id)}
                >
                  <Share2 className={`w-4 h-4 ${sharedPosts.has(post.id) ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline text-xs">Share</span>
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 bg-transparent text-muted-foreground hover:text-primary"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Download</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Post Details Modal */}
      {selectedPostId && (
        <PostDetailsModal isOpen={!!selectedPostId} onClose={() => setSelectedPostId(null)} postId={selectedPostId} />
      )}
    </>
  )
}
