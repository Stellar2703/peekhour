"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { MessageCircle, Share2, Download, Zap, MapPin, Calendar, Users } from "lucide-react"
import { CommentSection } from "./comment-section"
import { useState as useStateHook } from "react"

interface PostDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
}

export function PostDetailsModal({ isOpen, onClose, postId }: PostDetailsModalProps) {
  const [isLiked, setIsLiked] = useStateHook(false)
  const [thankCount, setThankCount] = useStateHook(342)
  const [isShared, setIsShared] = useStateHook(false)

  const handleThank = () => {
    setIsLiked(!isLiked)
    setThankCount(isLiked ? thankCount - 1 : thankCount + 1)
  }

  const handleShare = () => {
    setIsShared(!isShared)
    alert("Sharing content: " + (isShared ? "Share removed" : "Content shared successfully"))
  }

  const handleDownload = () => {
    alert("Downloading content...")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Details</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Media */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img src="/placeholder.svg" alt="Post content" className="w-full h-full object-cover" />
          </div>

          {/* Post Info */}
          <div className="space-y-4">
            {/* Author Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">@sarahjohn</p>
                </div>
              </div>
              <Button variant="outline" className="bg-transparent">
                Follow
              </Button>
            </div>

            {/* Post Content */}
            <div>
              <p className="text-sm leading-relaxed">
                Amazing sunset view from Marina Beach! The colors today were incredible. Perfect evening for a walk with
                friends and capturing beautiful moments.
              </p>
            </div>

            {/* Post Metadata */}
            <Card className="p-3 bg-muted/50 border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Mylapore, Marina Beach, Chennai</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span>December 15, 2024</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span>City Events Department</span>
              </div>
            </Card>

            {/* Interaction Stats */}
            <div className="flex justify-between text-xs text-muted-foreground border-b border-border pb-3">
              <span>{thankCount} Thanks</span>
              <span>28 Comments</span>
              <span>15 Shares</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="ghost"
                className={`gap-2 bg-transparent ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-primary"}`}
                onClick={handleThank}
              >
                <Zap className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="hidden sm:inline text-xs">Thanks</span>
              </Button>
              <Button variant="ghost" className="gap-2 bg-transparent text-muted-foreground hover:text-primary">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Comment</span>
              </Button>
              <Button
                variant="ghost"
                className={`gap-2 bg-transparent ${isShared ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                onClick={handleShare}
              >
                <Share2 className={`w-4 h-4 ${isShared ? "fill-current" : ""}`} />
                <span className="hidden sm:inline text-xs">Share</span>
              </Button>
              <Button
                variant="ghost"
                className="gap-2 bg-transparent text-muted-foreground hover:text-primary"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Save</span>
              </Button>
            </div>

            {/* Comments Section */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-sm mb-4">Comments</h3>
              <CommentSection postId={postId} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
