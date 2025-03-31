// src/components/dashboard/RecentSessions.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Icons
import {
  Clock,
  Tag,
  BookOpen,
  ChevronRight,
  Calendar,
  MoreVertical,
  Pencil,
  Trash,
  ChevronLeft
} from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Supabase and Types
import { supabase } from "@/lib/supabase/client";
import { FocusSession } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

// Constants
const SESSIONS_PER_PAGE = 5;

// Component Props Interface
interface RecentSessionsProps {
  sessions: FocusSession[];
  isLoading?: boolean;
  className?: string;
  onSessionUpdated?: () => void;
}

export default function RecentSessions({
  sessions = [],
  isLoading = false,
  className,
  onSessionUpdated
}: RecentSessionsProps) {
  // State Management
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedSessionName, setEditedSessionName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized Pagination Logic
  const sessionPagination = useMemo(() => {
    // Make sure sessions are sorted by end_time in descending order
    const sortedSessions = [...sessions].sort((a, b) => {
      // Convert to dates for comparison (handling null values)
      const dateA = a.end_time ? new Date(a.end_time) : new Date(0);
      const dateB = b.end_time ? new Date(b.end_time) : new Date(0);

      // Sort in descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });

    const totalSessions = sortedSessions.length;
    const totalPages = Math.ceil(totalSessions / SESSIONS_PER_PAGE);
    const start = (currentPage - 1) * SESSIONS_PER_PAGE;
    const end = start + SESSIONS_PER_PAGE;
    const paginatedSessions = sortedSessions.slice(start, end);

    return {
      totalSessions,
      totalPages,
      paginatedSessions
    };
  }, [sessions, currentPage]);

  // Utility Functions
  const formatDuration = useCallback((minutes: number | undefined | null) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Hoy, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ayer, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM, HH:mm', { locale: es });
    }
  }, []);

  // Page Navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= sessionPagination.totalPages) {
      setCurrentPage(page);
    }
  }, [sessionPagination.totalPages]);

  // Session Editing Methods
  const startEditing = useCallback((session: FocusSession) => {
    setEditingSessionId(session.id);
    setEditedSessionName(session.session_name || '');
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingSessionId(null);
    setEditedSessionName('');
  }, []);

  // Save Edited Session Name
  const saveSessionName = useCallback(async (sessionId: string) => {
    if (!editedSessionName.trim()) {
      toast.warning('El nombre de la sesión no puede estar vacío');
      return;
    }

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('focus_sessions')
        .update({ session_name: editedSessionName.trim() })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Nombre de sesión actualizado');
      setEditingSessionId(null);

      // Call the callback to refresh the session list
      if (onSessionUpdated) {
        onSessionUpdated();
      }

    } catch (error) {
      console.error('Error updating session name:', error);
      toast.error('Error al actualizar el nombre de la sesión');
    } finally {
      setActionLoading(false);
    }
  }, [editedSessionName, onSessionUpdated]);

  // Delete Session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setActionLoading(true);

      // Get the session first to determine how many minutes to subtract
      const { data: session, error: fetchError } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the session
      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Subtract the minutes from the user's total focus time
      if (session && session.duration_minutes) {
        await supabase.rpc('decrement_focus_time', {
          minutes_to_subtract: session.duration_minutes
        });
      }

      toast.success('Sesión eliminada');

      // Call the callback to refresh sessions
      if (onSessionUpdated) {
        onSessionUpdated();
      }

    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Error al eliminar la sesión');
    } finally {
      setActionLoading(false);
    }
  }, [onSessionUpdated]);

  // Render Loading State
  if (isLoading) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800 flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-400" />
            Historial de Sesiones
          </CardTitle>
          <CardDescription className="text-gray-400">
            Mostrando {sessionPagination.paginatedSessions.length} de {sessionPagination.totalSessions} sesiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 bg-[#262638]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-[#1a1a2e] border-gray-800", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-400" />
              Sesiones Recientes
            </CardTitle>
            <CardDescription className="text-gray-400 my-2">
              Mostrando {sessionPagination.paginatedSessions.length} de {sessionPagination.totalSessions} sesiones
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessionPagination.paginatedSessions.length > 0 ? (
          <div className="space-y-3">
            {sessionPagination.paginatedSessions.map((session) => (
              <div key={session.id} className="p-3 rounded-md bg-[#262638]">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    {/* Session name - editable */}
                    {editingSessionId === session.id ? (
                      <div className="flex gap-2 items-center mb-2">
                        <Input
                          value={editedSessionName}
                          onChange={(e) => setEditedSessionName(e.target.value)}
                          className="h-8 bg-[#1a1a2e] border-gray-700 text-white"
                          placeholder="Nombre de la sesión"
                          disabled={actionLoading}
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            disabled={actionLoading}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveSessionName(session.id)}
                            className="h-8 bg-purple-600 hover:bg-purple-700"
                            disabled={actionLoading || !editedSessionName.trim()}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center font-medium text-white">
                        <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span>{session.session_name || 'Sesión sin nombre'}</span>
                      </div>
                    )}

                    {/* Task name if available */}
                    {session.task && (
                      <div className="flex items-center text-sm text-gray-400">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        <span>{session.task.name}</span>
                      </div>
                    )}

                    {/* Time details */}
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      <span>{formatDate(session.end_time || session.start_time)}</span>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3 mr-1.5" />
                      <span>{formatDuration(session.duration_minutes)}</span>
                    </div>
                  </div>

                  {/* Edit and actions dropdown */}
                  {!editingSessionId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-[#262638] border-gray-700 text-white">
                        <DropdownMenuItem
                          onClick={() => startEditing(session)}
                          className="cursor-pointer flex items-center hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4 mr-2 text-blue-400" />
                          <span>Editar nombre</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => deleteSession(session.id)}
                          className="cursor-pointer flex items-center text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          <span>Eliminar sesión</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay sesiones registradas</p>
            <p className="text-sm mt-1">¡Comienza tu primera sesión de enfoque!</p>
          </div>
        )}

        {/* Pagination controls */}
        {sessionPagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || actionLoading}
              className="h-8 w-8 bg-transparent border-gray-700 text-gray-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-400">
              Página {currentPage} de {sessionPagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= sessionPagination.totalPages || actionLoading}
              className="h-8 w-8 bg-transparent border-gray-700 text-gray-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}