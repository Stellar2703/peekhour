'use client';

import { useState, useEffect } from 'react';
import { departmentEnhancementsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  location: string | null;
  start_time: string;
  end_time: string;
  max_attendees: number | null;
  creator_username: string;
  creator_name: string;
  creator_avatar: string;
  going_count: number;
  maybe_count: number;
  is_active: boolean;
}

interface EventCalendarProps {
  departmentId: number;
  canCreateEvent?: boolean;
}

export default function EventCalendar({
  departmentId,
  canCreateEvent = false,
}: EventCalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'meetup',
    location: '',
    startTime: '',
    endTime: '',
    maxAttendees: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [departmentId]);

  const fetchEvents = async () => {
    try {
      const response = await departmentEnhancementsApi.getEvents(departmentId);
      if (response.success) {
        setEvents(response.data as Event[]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await departmentEnhancementsApi.createEvent(departmentId, {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        location: formData.location || null,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
        setShowCreateDialog(false);
        setFormData({
          title: '',
          description: '',
          eventType: 'meetup',
          location: '',
          startTime: '',
          endTime: '',
          maxAttendees: '',
        });
        fetchEvents();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleRSVP = async (eventId: number, status: string) => {
    try {
      const response = await departmentEnhancementsApi.rsvpEvent(eventId, status);
      if (response.success) {
        toast({
          title: 'Success',
          description: `RSVP updated to ${status}`,
        });
        fetchEvents();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update RSVP',
        variant: 'destructive',
      });
    }
  };

  const getEventTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: any }> = {
      meetup: { label: 'Meetup', variant: 'default' },
      workshop: { label: 'Workshop', variant: 'secondary' },
      conference: { label: 'Conference', variant: 'outline' },
      online: { label: 'Online', variant: 'secondary' },
    };

    const config = types[type] || types.meetup;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events
              </CardTitle>
              <CardDescription>Upcoming department events and meetups</CardDescription>
            </div>
            {canCreateEvent && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                      Create a new event for department members
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select
                        value={formData.eventType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, eventType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meetup">Meetup</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({ ...formData, startTime: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({ ...formData, endTime: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        min="1"
                        value={formData.maxAttendees}
                        onChange={(e) =>
                          setFormData({ ...formData, maxAttendees: e.target.value })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Event
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            {getEventTypeBadge(event.event_type)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={event.creator_avatar}
                              alt={event.creator_username}
                            />
                            <AvatarFallback>
                              {event.creator_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            by @{event.creator_username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.going_count} going, {event.maybe_count} maybe
                          </span>
                        </div>
                        {event.max_attendees && (
                          <Badge variant="outline">
                            Max: {event.max_attendees}
                          </Badge>
                        )}
                      </div>

                      {user && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleRSVP(event.id, 'going')}
                          >
                            Going
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRSVP(event.id, 'maybe')}
                          >
                            Maybe
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRSVP(event.id, 'not_going')}
                          >
                            Not Going
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
