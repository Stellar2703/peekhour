"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Share2, Download, ImageIcon, Video, Volume2 } from "lucide-react"

interface SearchResult {
  id: string
  title: string
  author: string
  username: string
  avatar: string
  location: string
  date: string
  department: string
  description: string
  mediaType: "photo" | "video" | "audio"
  thumbnail: string
  likes: number
  comments: number
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Marina Beach Evening Event",
    author: "Sarah Johnson",
    username: "@sarahjohn",
    avatar: "SJ",
    location: "Marina Beach, Chennai",
    date: "2024-12-15",
    department: "City Events",
    description: "Beautiful evening at Marina Beach with sunset views and community gathering.",
    mediaType: "photo",
    thumbnail: "/placeholder.svg",
    likes: 234,
    comments: 18,
  },
  {
    id: "2",
    title: "Tech Conference 2024",
    author: "Raj Tech",
    username: "@rajtech",
    avatar: "RT",
    location: "Bangalore IT Park, Bangalore",
    date: "2024-12-14",
    department: "Tech Meetup",
    description: "Latest developments in AI and Machine Learning discussed by industry experts.",
    mediaType: "video",
    thumbnail: "/placeholder.svg",
    likes: 456,
    comments: 52,
  },
  {
    id: "3",
    title: "Local Podcast Recording",
    author: "Mike Pod",
    username: "@mikepod",
    avatar: "MP",
    location: "Indiranagar, Bangalore",
    date: "2024-12-13",
    department: "Community",
    description: "Weekly podcast discussing local stories and community updates.",
    mediaType: "audio",
    thumbnail: "/placeholder.svg",
    likes: 123,
    comments: 28,
  },
]

interface SearchResultsProps {
  filters: Record<string, string>
  hasSearched: boolean
}

export function SearchResults({ filters, hasSearched }: SearchResultsProps) {
  const [viewType, setViewType] = useState<"grid" | "timeline">("grid")

  if (!hasSearched) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">Use the filters above to search for events and content</p>
      </div>
    )
  }

  const activeFilters = Object.values(filters).filter((v) => v !== "").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {mockResults.length} results found
            {activeFilters > 0 && ` with ${activeFilters} active filter(s)`}
          </p>
        </div>
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as "grid" | "timeline")}>
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewType === "grid" ? (
        <div className="grid md:grid-cols-2 gap-4">
          {mockResults.map((result) => (
            <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden group">
                <img
                  src={result.thumbnail || "/placeholder.svg"}
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  {result.mediaType === "photo" && (
                    <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                  )}
                  {result.mediaType === "video" && (
                    <Video className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                  )}
                  {result.mediaType === "audio" && (
                    <Volume2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{result.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{result.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {result.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{result.author}</p>
                    <p className="text-xs text-muted-foreground">{result.username}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <p>📍 {result.location}</p>
                  <p>🏢 {result.department}</p>
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                  <span>{result.likes} likes</span>
                  <span>·</span>
                  <span>{result.comments} comments</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Like</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Comment</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Share</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {mockResults.map((result) => (
            <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-32 h-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    <img
                      src={result.thumbnail || "/placeholder.svg"}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{result.title}</h3>
                        <p className="text-xs text-muted-foreground">{result.date}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {result.mediaType === "photo" && "📷"}
                        {result.mediaType === "video" && "🎥"}
                        {result.mediaType === "audio" && "🎙️"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{result.description}</p>

                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {result.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{result.author}</span>
                      <span className="text-xs text-muted-foreground">({result.username})</span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 mb-2">
                      <p>
                        📍 {result.location} • 🏢 {result.department}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                      >
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{result.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-xs">{result.comments}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 bg-transparent text-muted-foreground hover:text-primary"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
