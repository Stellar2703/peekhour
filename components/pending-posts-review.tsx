'use client';

import { useState, useEffect } from 'react';
import { departmentEnhancementsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, Image as ImageIcon } from 'lucide-react';

interface PendingPost {
  id: number;
  post_id: number;
  content: string;
  media_url: string | null;
  username: string;
  name: string;
  avatar: string;
  created_at: string;
  post_created_at: string;
  status: string;
}

interface PendingPostsReviewProps {
  departmentId: number;
}

export default function PendingPostsReview({
  departmentId,
}: PendingPostsReviewProps) {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPosts();
  }, [departmentId]);

  const fetchPendingPosts = async () => {
    try {
      const response = await departmentEnhancementsApi.getPendingPosts(departmentId);
      if (response.success) {
        setPendingPosts(response.data as PendingPost[]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pending posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: number) => {
    try {
      const response = await departmentEnhancementsApi.reviewPendingPost(
        postId,
        'approve'
      );
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Post approved successfully',
        });
        fetchPendingPosts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve post',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;

    try {
      const response = await departmentEnhancementsApi.reviewPendingPost(
        selectedPost.post_id,
        'reject',
        rejectionReason
      );
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Post rejected',
        });
        setShowRejectDialog(false);
        setSelectedPost(null);
        setRejectionReason('');
        fetchPendingPosts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject post',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading pending posts...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Posts Review
          </CardTitle>
          <CardDescription>
            Review and approve posts submitted by members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending posts to review
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.avatar} alt={post.username} />
                          <AvatarFallback>{post.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">{post.name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{post.username}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(post.post_created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                            {post.media_url && (
                              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                {post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img
                                    src={post.media_url}
                                    alt="Post media"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(post.post_id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedPost(post);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this post (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Violates community guidelines, spam, inappropriate content..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
              >
                Reject Post
              </Button>
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedPost(null);
                  setRejectionReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
