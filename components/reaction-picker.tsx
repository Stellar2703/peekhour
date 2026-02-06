'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, ThumbsUp, Smile, Frown, Angry, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReactionType = 'like' | 'love' | 'wow' | 'sad' | 'angry' | 'celebrate';

interface ReactionPickerProps {
  onReact: (reactionType: ReactionType) => void;
  currentReaction?: ReactionType | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const reactions = [
  { type: 'like' as ReactionType, icon: ThumbsUp, label: 'Like', color: 'text-blue-500', hoverColor: 'hover:bg-blue-50' },
  { type: 'love' as ReactionType, icon: Heart, label: 'Love', color: 'text-red-500', hoverColor: 'hover:bg-red-50' },
  { type: 'wow' as ReactionType, icon: Smile, label: 'Wow', color: 'text-yellow-500', hoverColor: 'hover:bg-yellow-50' },
  { type: 'sad' as ReactionType, icon: Frown, label: 'Sad', color: 'text-gray-500', hoverColor: 'hover:bg-gray-50' },
  { type: 'angry' as ReactionType, icon: Angry, label: 'Angry', color: 'text-orange-500', hoverColor: 'hover:bg-orange-50' },
  { type: 'celebrate' as ReactionType, icon: PartyPopper, label: 'Celebrate', color: 'text-purple-500', hoverColor: 'hover:bg-purple-50' },
];

// Define reaction definitions for reuse
const REACTION_DEFINITIONS = reactions;

export function ReactionPicker({ 
  onReact, 
  currentReaction, 
  size = 'md',
  showLabel = true 
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentReactionData = reactions.find(r => r.type === currentReaction);
  const CurrentIcon = currentReactionData?.icon || ThumbsUp;

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';

  const handleReaction = (reactionType: ReactionType) => {
    onReact(reactionType);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={currentReaction ? 'default' : 'ghost'}
          size={buttonSize}
          className={cn(
            'gap-2',
            currentReaction && currentReactionData?.color
          )}
        >
          <CurrentIcon className={iconSize} />
          {showLabel && (currentReactionData?.label || 'React')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const isActive = currentReaction === reaction.type;
            
            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(reaction.type)}
                className={cn(
                  'flex flex-col items-center gap-1 h-auto py-2 px-3',
                  reaction.hoverColor,
                  isActive && 'bg-accent'
                )}
                title={reaction.label}
              >
                <Icon className={cn('w-5 h-5', reaction.color)} />
                <span className="text-xs">{reaction.label}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReactionCount({ 
  reactions: reactionCounts, 
  onClick 
}: { 
  reactions: Array<{ reaction_type: ReactionType; count: number }>;
  onClick?: () => void;
}) {
  if (!reactionCounts || reactionCounts.length === 0) return null;

  const totalCount = reactionCounts.reduce((sum, r) => sum + r.count, 0);
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
    >
      <div className="flex -space-x-1">
        {reactionCounts.slice(0, 3).map((reaction) => {
          const reactionData = REACTION_DEFINITIONS.find(r => r.type === reaction.reaction_type);
          if (!reactionData) return null;
          
          const Icon = reactionData.icon;
          return (
            <div
              key={reaction.reaction_type}
              className={cn(
                'w-5 h-5 rounded-full bg-white border-2 border-background flex items-center justify-center',
                reactionData.color
              )}
            >
              <Icon className="w-3 h-3" />
            </div>
          );
        })}
      </div>
      <span>{totalCount}</span>
    </button>
  );
}

export function getReactionIcon(reactionType: ReactionType) {
  const reaction = reactions.find(r => r.type === reactionType);
  return reaction?.icon || ThumbsUp;
}

export function getReactionColor(reactionType: ReactionType) {
  const reaction = reactions.find(r => r.type === reactionType);
  return reaction?.color || 'text-blue-500';
}
