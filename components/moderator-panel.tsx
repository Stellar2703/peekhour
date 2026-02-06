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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, UserMinus, Settings } from 'lucide-react';

interface Moderator {
  id: number;
  user_id: number;
  username: string;
  name: string;
  avatar: string;
  permissions: {
    canApprovePost: boolean;
    canDeletePost: boolean;
    canDeleteComment: boolean;
    canBanUser: boolean;
    canCreateEvent: boolean;
    canEditRules: boolean;
  };
  assigned_by_username: string;
  assigned_by_name: string;
  assigned_at: string;
}

interface ModeratorPanelProps {
  departmentId: number;
  isAdmin: boolean;
}

export default function ModeratorPanel({ departmentId, isAdmin }: ModeratorPanelProps) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMod, setSelectedMod] = useState<Moderator | null>(null);
  const [permissions, setPermissions] = useState({
    canApprovePost: true,
    canDeletePost: true,
    canDeleteComment: true,
    canBanUser: false,
    canCreateEvent: true,
    canEditRules: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchModerators();
  }, [departmentId]);

  const fetchModerators = async () => {
    try {
      const response = await departmentEnhancementsApi.getModerators(departmentId);
      if (response.success) {
        setModerators(response.data as Moderator[]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch moderators',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModerator = async (moderatorId: number) => {
    try {
      const response = await departmentEnhancementsApi.removeModerator(
        departmentId,
        moderatorId
      );
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Moderator removed successfully',
        });
        fetchModerators();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove moderator',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermissions = async (moderatorId: number) => {
    try {
      const response = await departmentEnhancementsApi.updateModeratorPermissions(
        departmentId,
        moderatorId,
        permissions
      );
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Permissions updated successfully',
        });
        setSelectedMod(null);
        fetchModerators();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading moderators...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Moderators
            </CardTitle>
            <CardDescription>
              Manage department moderators and their permissions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {moderators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No moderators yet</p>
        ) : (
          <div className="space-y-4">
            {moderators.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={mod.avatar} alt={mod.username} />
                    <AvatarFallback>{mod.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{mod.name}</p>
                    <p className="text-sm text-muted-foreground">@{mod.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added by @{mod.assigned_by_username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(mod.permissions as any).canApprovePost && (
                      <Badge variant="secondary">Approve Posts</Badge>
                    )}
                    {JSON.parse(mod.permissions as any).canDeletePost && (
                      <Badge variant="secondary">Delete Posts</Badge>
                    )}
                    {JSON.parse(mod.permissions as any).canCreateEvent && (
                      <Badge variant="secondary">Create Events</Badge>
                    )}
                    {JSON.parse(mod.permissions as any).canBanUser && (
                      <Badge variant="destructive">Ban Users</Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Dialog
                        open={selectedMod?.id === mod.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setSelectedMod(mod);
                            setPermissions(JSON.parse(mod.permissions as any));
                          } else {
                            setSelectedMod(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Permissions</DialogTitle>
                            <DialogDescription>
                              Manage permissions for @{mod.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canApprovePost"
                                checked={permissions.canApprovePost}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canApprovePost: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canApprovePost">Can approve posts</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canDeletePost"
                                checked={permissions.canDeletePost}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canDeletePost: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canDeletePost">Can delete posts</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canDeleteComment"
                                checked={permissions.canDeleteComment}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canDeleteComment: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canDeleteComment">Can delete comments</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canCreateEvent"
                                checked={permissions.canCreateEvent}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canCreateEvent: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canCreateEvent">Can create events</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canEditRules"
                                checked={permissions.canEditRules}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canEditRules: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canEditRules">Can edit rules</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="canBanUser"
                                checked={permissions.canBanUser}
                                onCheckedChange={(checked) =>
                                  setPermissions({
                                    ...permissions,
                                    canBanUser: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="canBanUser">Can ban users</Label>
                            </div>
                            <Button
                              onClick={() => handleUpdatePermissions(mod.user_id)}
                              className="w-full"
                            >
                              Save Permissions
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveModerator(mod.user_id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
