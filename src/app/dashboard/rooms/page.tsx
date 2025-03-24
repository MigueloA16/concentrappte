// app/dashboard/rooms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Lock, Unlock, LogIn } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type StudyRoom = Database['public']['Tables']['study_rooms']['Row'];

export default function StudyRoomsPage() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomToJoin, setRoomToJoin] = useState<StudyRoom | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  // Load rooms
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("study_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast.error(`Error loading rooms: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    try {
      // Generate a random 6-character access code if private
      const code = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
      
      const { error } = await supabase
        .from("study_rooms")
        .insert({
          name: newRoomName.trim(),
          is_private: isPrivate,
          access_code: code,
          current_participants: 0,
        });

      if (error) throw error;

      toast.success(`Room "${newRoomName}" created successfully!`);
      if (isPrivate && code) {
        toast.info(`Access code: ${code}`);
      }
      
      setNewRoomName("");
      setIsPrivate(false);
      setAccessCode("");
      setCreateDialogOpen(false);
      fetchRooms();
    } catch (error: any) {
      toast.error(`Failed to create room: ${error.message}`);
    }
  };

  const handleJoinRoom = async (room: StudyRoom) => {
    if (room.is_private) {
      setRoomToJoin(room);
      setJoinDialogOpen(true);
      return;
    }

    try {
      await joinRoomAction(room.id);
    } catch (error: any) {
      toast.error(`Failed to join room: ${error.message}`);
    }
  };

  const joinRoomAction = async (roomId: string, code?: string) => {
    try {
      // For private rooms, verify the access code
      if (roomToJoin?.is_private) {
        if (!code) {
          toast.error("Please enter the access code");
          return;
        }

        if (code !== roomToJoin.access_code) {
          toast.error("Invalid access code");
          return;
        }
      }

      // Join the room
      const { error: joinError } = await supabase
        .from("room_participants")
        .insert({
          room_id: roomId,
          joined_at: new Date().toISOString(),
        });

      if (joinError) throw joinError;

      // Increment participant count
      const { error: updateError } = await supabase
        .rpc("increment_room_participants", {
          room_id_param: roomId,
          increment_by: 1
        });

      if (updateError) throw updateError;

      toast.success("Joined room successfully!");
      setJoinDialogOpen(false);
      setJoinCode("");
      setRoomToJoin(null);

      // Redirect to the room
      window.location.href = `/rooms/${roomId}`;
    } catch (error: any) {
      toast.error(`Failed to join room: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Grupos de Estudio</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear un Nuevo Grupo de Estudio</DialogTitle>
              <DialogDescription>
                Create a room to study with friends or other learners.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="roomName" className="text-sm font-medium">
                  Nombre del Grupo
                </label>
                <Input
                  id="roomName"
                  placeholder="My Study Group"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={isPrivate ? "outline" : "default"}
                  onClick={() => setIsPrivate(false)}
                  className="flex-1"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Public
                </Button>
                <Button
                  type="button"
                  variant={isPrivate ? "default" : "outline"}
                  onClick={() => setIsPrivate(true)}
                  className="flex-1"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Private
                </Button>
              </div>
              {isPrivate && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Un código de acceso único será generado para ingresar a éstos grupos.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRoom}>Create Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="mb-4">No study rooms available. Create your first room!</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{room.name}</CardTitle>
                  {room.is_private ? (
                    <Lock className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <CardDescription>
                  Created {new Date(room.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {room.current_participants} participants online
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleJoinRoom(room)}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Join Room
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Join Private Room Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Private Room</DialogTitle>
            <DialogDescription>
              Enter the access code to join "{roomToJoin?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium">
                Access Code
              </label>
              <Input
                id="accessCode"
                placeholder="Enter access code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => roomToJoin && joinRoomAction(roomToJoin.id, joinCode)}>
              Join Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
