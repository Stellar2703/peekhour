"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Bold, Italic, Type } from "lucide-react"

interface Comment {
  id: string
  author: string
  username: string
  avatar: string
  content: string
  timestamp: Date
  isBold?: boolean
  isItalic?: boolean
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Mike Park",
      username: "@mikepark",
      avatar: "MP",
      content: "Amazing shot! Love the composition.",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      author: "Emma Chen",
      username: "@emmachen",
      avatar: "EC",
      content: "When was this taken? Looks like the perfect time of day.",
      timestamp: new Date(Date.now() - 1800000),
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: "You",
      username: "@yourname",
      avatar: "YN",
      content: newComment,
      timestamp: new Date(),
      isBold,
      isItalic,
    }

    setComments([...comments, comment])
    setNewComment("")
    setIsBold(false)
    setIsItalic(false)
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <Card className="p-4 bg-muted/50 border-none">
        <div className="space-y-3">
          {/* Text Formatting Toolbar */}
          <div className="flex gap-1">
            <Button
              variant={isBold ? "default" : "ghost"}
              size="sm"
              className="gap-1 bg-transparent text-sm"
              onClick={() => setIsBold(!isBold)}
              title="Bold text"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={isItalic ? "default" : "ghost"}
              size="sm"
              className="gap-1 bg-transparent text-sm"
              onClick={() => setIsItalic(!isItalic)}
              title="Italic text"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
              <Type className="w-3 h-3" />
              <span>Rich text enabled</span>
            </div>
          </div>

          {/* Comment Input Field */}
          <div className="relative">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleAddComment()
                }
              }}
              className="pr-24"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              Post
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-3 bg-muted/30 border-border/50">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {comment.avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  <p
                    className={`text-sm mt-1 text-foreground ${comment.isBold ? "font-semibold" : ""} ${comment.isItalic ? "italic" : ""}`}
                  >
                    {comment.content}
                  </p>

                  <div className="flex gap-4 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground bg-transparent"
                    >
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground bg-transparent"
                    >
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* View More Comments */}
      {comments.length > 3 && (
        <Button variant="outline" className="w-full bg-transparent">
          View all {comments.length} comments
        </Button>
      )}
    </div>
  )
}
