'use client';

import { useState } from 'react';
import { followApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: number;
  username: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  userId, 
  username, 
  initialIsFollowing,
  onFollowChange 
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  // Don't show button on own profile
  if (user?.userId === userId) {
    return null;
  }

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        const response = await followApi.unfollowUser(userId);
        if (response.error) throw new Error(response.error);
        
        setIsFollowing(false);
        onFollowChange?.(false);
        toast({
          title: 'Unfollowed',
          description: `You unfollowed @${username}`,
        });
      } else {
        const response = await followApi.followUser(userId);
        if (response.error) throw new Error(response.error);
        
        setIsFollowing(true);
        onFollowChange?.(true);
        toast({
          title: 'Following',
          description: `You are now following @${username}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      const response = await followApi.blockUser(userId);
      if (response.error) throw new Error(response.error);
      
      setIsFollowing(false);
      onFollowChange?.(false);
      toast({
        title: 'User Blocked',
        description: `You blocked @${username}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to block user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowBlockConfirm(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleFollow}
        disabled={isLoading}
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserMinus className="w-4 h-4" />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </Button>

      {!showBlockConfirm ? (
        <Button
          onClick={() => setShowBlockConfirm(true)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Shield className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={handleBlock}
          disabled={isLoading}
          variant="destructive"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Confirm Block'
          )}
        </Button>
      )}
    </div>
  );
}
