// src/components/timer/TaskManager.tsx - with sorting by status and duration display

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Play, MoreVertical, Check, Clock, LayoutGrid, Trash, CheckCircle2, XCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  deleted?: boolean;
};

type TaskManagerProps = {
  tasks: Task[];
  onTasksChanged?: () => void;
};

export default function TaskManager({ tasks: initialTasks = [], onTasksChanged }: TaskManagerProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskName, setNewTaskName] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const tasksPerPage = 5;
  // Count by status
  const [taskCounts, setTaskCounts] = useState({
    in_progress: 0,
    pending: 0,
    completed: 0
  });

  // Get total task count on initial load and counts by status
  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get counts by status directly using group by query
        const { data, error } = await supabase
          .from("tasks")
          .select("status")
          .eq("user_id", user.id)
          .eq("deleted", false);

        if (error) throw error;

        // Initialize counts
        const counts = {
          in_progress: 0,
          pending: 0,
          completed: 0
        };

        // Count tasks by status
        data.forEach(task => {
          if (task.status in counts) {
            counts[task.status as keyof typeof counts]++;
          }
        });

        // Update state with accurate counts
        setTaskCounts(counts);
        setTotalTasks(data.length);
      } catch (error) {
        console.error("Error fetching task counts:", error);
      } finally {
        setLoading(false);
      }
    };

    // Run this effect independently of pagination
    fetchTaskCount();

    // Set up a refresh interval for the counts
    const intervalId = setInterval(fetchTaskCount, 5000);

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to run only on mount

  // Fetch tasks based on current page with priority ordering
  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate offset for pagination
      const offset = (page - 1) * tasksPerPage;

      // Get all tasks sorted by status priority (in_progress, pending, completed) and then by creation date
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("status", { ascending: true, nullsFirst: false }) // Custom ordering will be applied in JS
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Custom sort function to prioritize: in_progress > pending > completed
      const sortedData = [...(data || [])].sort((a, b) => {
        const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      // Apply pagination
      const paginatedData = sortedData.slice(offset, offset + tasksPerPage);

      setTasks(paginatedData);
      setCurrentPage(page);

      // Update task counts
      const counts = {
        in_progress: 0,
        pending: 0,
        completed: 0
      };

      data.forEach(task => {
        if (task.status in counts) {
          counts[task.status]++;
        }
      });

      setTaskCounts(counts);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  // Handle page changes
  const goToPage = async (page: number) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate offset for pagination
      const offset = (page - 1) * tasksPerPage;

      // Get all tasks sorted by status priority and then by creation date
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("status", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Custom sort function to prioritize: in_progress > pending > completed
      const sortedData = [...(data || [])].sort((a, b) => {
        const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      });

      // Apply pagination
      const paginatedData = sortedData.slice(offset, offset + tasksPerPage);

      setTasks(paginatedData);
      setCurrentPage(page);

      // Don't update task counts here, leave that to the dedicated effect
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };
  // Keep tasks in sync with initialTasks prop for the first page
  useEffect(() => {
    if (currentPage === 1) {
      const sortedInitialTasks = [...initialTasks].sort((a, b) => {
        const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setTasks(sortedInitialTasks);

      // Update task counts from initial tasks
      const counts = {
        in_progress: 0,
        pending: 0,
        completed: 0
      };

      initialTasks.forEach(task => {
        if (task.status in counts) {
          counts[task.status]++;
        }
      });

      setTaskCounts(counts);
    }
  }, [initialTasks, currentPage]);

  useEffect(() => {
    const checkForStatusChanges = async () => {
      // Only run if we have tasks loaded and a user is logged in
      if (tasks.length === 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get IDs of current tasks to check for updates
        const taskIds = tasks.map(task => task.id);

        // Fetch latest status for these tasks
        const { data, error } = await supabase
          .from("tasks")
          .select("id, status, updated_at")
          .in("id", taskIds);

        if (error) throw error;

        // Check if any statuses have changed
        let hasChanges = false;
        const updatedTasks = [...tasks];

        for (let i = 0; i < updatedTasks.length; i++) {
          const serverTask = data.find(t => t.id === updatedTasks[i].id);
          if (serverTask && updatedTasks[i].status !== serverTask.status) {
            updatedTasks[i].status = serverTask.status;
            updatedTasks[i].updated_at = serverTask.updated_at;
            hasChanges = true;
          }
        }

        // If we found changes, update the tasks and resort
        if (hasChanges) {
          // Resort by status priority
          const sortedTasks = updatedTasks.sort((a, b) => {
            const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          });

          setTasks(sortedTasks);

          // Also refresh the task counts
          await refreshTaskCounts();
        }
      } catch (error) {
        console.error("Error checking for task status changes:", error);
      }
    };

    // Run immediately and then every 3 seconds
    checkForStatusChanges();
    const intervalId = setInterval(checkForStatusChanges, 3000);

    return () => clearInterval(intervalId);
  }, [tasks]); // Depends on tasks array

  const refreshTaskCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get counts by status
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("user_id", user.id)
        .eq("deleted", false);

      if (error) throw error;

      // Initialize counts
      const counts = {
        in_progress: 0,
        pending: 0,
        completed: 0
      };

      // Count tasks by status
      data.forEach(task => {
        if (task.status in counts) {
          counts[task.status as keyof typeof counts]++;
        }
      });

      // Update state with accurate counts
      setTaskCounts(counts);
      setTotalTasks(data.length);
    } catch (error) {
      console.error("Error refreshing task counts:", error);
    }
  };

  const createTask = async () => {
    if (!newTaskName.trim()) {
      toast.error("Por favor ingresa un nombre para la tarea");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          name: newTaskName.trim(),
          status: "pending",
          user_id: user.id,
          deleted: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update the task count
      setTotalTasks(prev => prev + 1);
      setTaskCounts(prev => ({
        ...prev,
        pending: prev.pending + 1
      }));

      // If we're on the first page, add the task to the list
      if (currentPage === 1) {
        // Add the new task at the appropriate position based on status
        const updatedTasks = [data, ...tasks].sort((a, b) => {
          const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        // Remove the last one if more than tasksPerPage
        if (updatedTasks.length > tasksPerPage) {
          updatedTasks.length = tasksPerPage;
        }

        setTasks(updatedTasks);
      } else {
        // If on a different page, navigate to the first page to see the new task
        setCurrentPage(1);
        fetchTasks(1);
      }

      setNewTaskName("");
      toast.success("Tarea creada exitosamente");

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

      // Refresh page data
      router.refresh();

    } catch (error) {
      console.error("Error al crear la tarea:", error);
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const taskToUpdate = tasks.find(task => task.id === id);
      if (!taskToUpdate) return;

      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add completed_at timestamp if marking as completed
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();

        // Calculate total duration for this task from all focus sessions
        const { data: taskSessions, error: sessionsError } = await supabase
          .from("focus_sessions")
          .select("duration_minutes")
          .eq("task_id", id)
          .eq("is_completed", true);

        if (sessionsError) throw sessionsError;

        // Sum up all session durations
        const totalDuration = taskSessions?.reduce((sum, session) =>
          sum + (session.duration_minutes || 0), 0) || 0;

        // Add the duration to the update
        updates.duration_minutes = totalDuration || 1;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Update the local tasks array
      const updatedTasks = tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      );

      // Sort tasks after status change
      const sortedTasks = updatedTasks.sort((a, b) => {
        const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setTasks(sortedTasks);

      // Instead of directly updating counters, refresh task counts from the server
      refreshTaskCounts();

      toast.success(`Tarea ${status === "completed" ? "completada" : "actualizada"}`);

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

      // Refresh page data
      router.refresh();

    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      toast.error("Error al actualizar la tarea");
    }
  };


  const deleteTask = async (id: string) => {
    try {
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) return;

      const { error } = await supabase
        .from("tasks")
        .update({
          deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Remove task from the list
      setTasks(tasks.filter(task => task.id !== id));
      setTotalTasks(prev => prev - 1);

      // Update task counts
      setTaskCounts(prev => ({
        ...prev,
        [taskToDelete.status]: prev[taskToDelete.status] - 1
      }));

      toast.success("Tarea eliminada exitosamente");

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

      // Refresh page data
      router.refresh();

    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const startFocusSession = async (task: Task) => {
    try {
      // First update the task to in_progress status
      if (task.status !== "in_progress") {
        const { error } = await supabase
          .from("tasks")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString()
          })
          .eq("id", task.id);

        if (error) throw error;

        // Update local state
        const updatedTasks = tasks.map(t =>
          t.id === task.id ? { ...t, status: "in_progress", updated_at: new Date().toISOString() } : t
        );

        // Sort tasks after status change
        const sortedTasks = updatedTasks.sort((a, b) => {
          const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        setTasks(sortedTasks);

        // Update task counts
        setTaskCounts(prev => ({
          ...prev,
          [task.status]: prev[task.status] - 1,
          in_progress: prev.in_progress + 1
        }));

        // Update the task object to have in_progress status
        task = { ...task, status: "in_progress" };
      }

      // Clear all existing timers and flags
      localStorage.removeItem('timerState');
      localStorage.removeItem('selectedTask');
      localStorage.removeItem('autoStartSession');

      // Then set our updated task and auto-start flag
      localStorage.setItem('selectedTask', JSON.stringify(task));
      localStorage.setItem('autoStartSession', 'true');

      // Notify the user
      toast.info(`Preparando sesión de enfoque para: ${task.name}`);

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

      // Add a slight delay before navigation to ensure localStorage is set
      setTimeout(() => {
        // For Next.js - redirecting to the timer tab
        router.push('/hub/?tab=timer');
      }, 100);
    } catch (error) {
      console.error("Error starting focus session:", error);
      toast.error("Error al iniciar la sesión de enfoque");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700">Completada</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600 hover:bg-blue-700 animate-pulse">En progreso</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-600 hover:bg-gray-700">{status}</Badge>;
    }
  };

  // Format minutes to hours and minutes display
  const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h:${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalTasks / tasksPerPage);

  return (
    <Card className="w-full bg-[#1a1a2e] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Administra Tus Tareas</CardTitle>
        <CardDescription className="text-gray-400">
          Organiza tus actividades y mantente enfocado en tus objetivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Task Counts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#262638] p-2 rounded text-center">
              <span className="text-blue-400 text-sm">En Progreso</span>
              <div className="text-white font-semibold">{taskCounts.in_progress}</div>
            </div>
            <div className="bg-[#262638] p-2 rounded text-center">
              <span className="text-yellow-400 text-sm">Pendientes</span>
              <div className="text-white font-semibold">{taskCounts.pending}</div>
            </div>
            <div className="bg-[#262638] p-2 rounded text-center">
              <span className="text-green-400 text-sm">Completadas</span>
              <div className="text-white font-semibold">{taskCounts.completed}</div>
            </div>
          </div>

          {/* Add Task Form */}
          <div className="flex space-x-2">
            <Input
              placeholder="Añadir nueva tarea..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask()}
              className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={createTask}
              disabled={loading || !newTaskName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "..." : "Añadir"}
            </Button>
          </div>

          {/* Task List */}
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-md
                    ${task.status === 'in_progress' ? 'bg-[#1E293B]' : 'bg-[#262638]'}
                    ${task.status === 'in_progress' ? 'border-l-4 border-blue-500' : ''}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                        className={`h-5 w-5 rounded-full flex items-center justify-center ${task.status === "completed" ? "bg-green-600 text-white" : "border border-gray-500"
                          }`}
                      >
                        {task.status === "completed" && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`text-white ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                        {task.name}
                      </span>
                      {getStatusBadge(task.status)}
                    </div>

                    {/* Show duration for completed tasks */}
                    {task.status === "completed" && task.duration_minutes && (
                      <div className="ml-8 mt-1 text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Tiempo total: {formatDuration(task.duration_minutes)}
                        {task.completed_at && (
                          <span className="ml-2">
                            • Completada: {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* If in progress, add a note */}
                    {task.status === "in_progress" && (
                      <div className="ml-8 mt-1 text-xs text-blue-400 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Tarea en progreso actualmente
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startFocusSession(task)}
                      className={`h-8 w-8 p-0 
                        ${task.status === "completed"
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        }`}
                      disabled={task.status === "completed"}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#262638] border-gray-700 text-white">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                        >
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          <span>Marcar en progreso</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                          <span>Marcar completada</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "pending")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                        >
                          <XCircle className="h-4 w-4 mr-2 text-yellow-400" />
                          <span>Marcar pendiente</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => deleteTask(task.id)}
                          className="flex items-center cursor-pointer text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No tienes tareas activas</p>
              <p className="mt-2">Añade una tarea para comenzar a trabajar</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8 p-0 border-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="h-8 w-8 p-0 border-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between w-full text-sm text-gray-400">
          <div>Total: {totalTasks} tareas</div>
          <div>
            Completadas: {taskCounts.completed} / {totalTasks} (total)
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}