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
import { 
  Play, 
  MoreVertical, 
  Clock, 
  LayoutGrid, 
  Trash, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Task } from "@/lib/supabase/database.types";
import { Skeleton } from "@/components/ui/skeleton";

// Custom status order for consistent sorting
const STATUS_ORDER = { 'in_progress': 0, 'pending': 1, 'completed': 2 };

type TaskManagerProps = {
  tasks: Task[];
  onTasksChanged?: () => void;
};

/**
 * TaskManager Component - manages task creation, updates, and display with pagination
 */
export default function TaskManager({ tasks: initialTasks = [], onTasksChanged }: TaskManagerProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskName, setNewTaskName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);

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

  // Sort function to be used consistently
  const sortTasksByStatus = (taskArray: Task[]) => {
    return [...taskArray].sort((a, b) => {
      // First sort by status priority
      const statusDiff = STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] - 
                         STATUS_ORDER[b.status as keyof typeof STATUS_ORDER];
      
      if (statusDiff !== 0) return statusDiff;
      
      // Then by creation date (newer first)
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
  };

  // Fetch task counts and total count - separate from pagination
  useEffect(() => {
    const fetchTaskCounts = async () => {
      try {
        setCountLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all tasks for counting
        const { data, error } = await supabase
          .from("tasks")
          .select("status")
          .eq("user_id", user.id)
          .eq("deleted", false);

        if (error) throw error;

        // Count tasks by status
        const counts = {
          in_progress: 0,
          pending: 0,
          completed: 0
        };

        data.forEach(task => {
          if (task.status in counts) {
            counts[task.status as keyof typeof counts]++;
          }
        });

        setTaskCounts(counts);
        setTotalTasks(data.length);
      } catch (error) {
        console.error("Error fetching task counts:", error);
        toast.error("Error fetching task counts");
      } finally {
        setCountLoading(false);
        setInitialLoading(false);
      }
    };

    fetchTaskCounts();
  }, []); // Run once on mount

  // Initialize task list from props
  useEffect(() => {
    if (initialTasks?.length > 0) {
      setTasks(sortTasksByStatus(initialTasks));
      setInitialLoading(false);
    }
  }, [initialTasks]);

  // Fetch tasks for a specific page
  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Calculate offset for pagination
      const offset = (page - 1) * tasksPerPage;

      // Fetch tasks with proper pagination
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false }) // Order by creation date first
        .range(offset, offset + tasksPerPage - 1); // Proper pagination range

      if (error) throw error;

      // Apply consistent sorting
      setTasks(sortTasksByStatus(data || []));
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.max(1, Math.ceil(totalTasks / tasksPerPage))) {
      return; // Invalid page
    }
    
    if (newPage !== currentPage) {
      fetchTasks(newPage);
    }
  };

  // Create a new task
  const createTask = async () => {
    if (!newTaskName.trim()) {
      toast.error("Por favor ingresa un nombre para la tarea");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          name: newTaskName.trim(),
          status: "pending",
          user_id: user.id,
          deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
        const updatedTasks = sortTasksByStatus([data, ...tasks]);
        
        // Keep only up to tasksPerPage items
        if (updatedTasks.length > tasksPerPage) {
          updatedTasks.length = tasksPerPage;
        }
        
        setTasks(updatedTasks);
      } else {
        // Navigate to first page to see the new task
        fetchTasks(1);
      }

      setNewTaskName("");
      toast.success("Tarea creada exitosamente");

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  // Update a task's status
  const updateTaskStatus = async (id: string, status: string) => {
    try {
      setLoading(true);
      const taskToUpdate = tasks.find(task => task.id === id);
      if (!taskToUpdate) return;

      const oldStatus = taskToUpdate.status;
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

        // Sum up all session durations, ensuring at least 1 minute total
        const totalDuration = taskSessions?.reduce((sum, session) =>
          sum + (session.duration_minutes || 0), 0) || 0;

        updates.duration_minutes = Math.max(1, totalDuration);
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
      setTasks(sortTasksByStatus(updatedTasks));

      // Update task counts
      setTaskCounts(prev => ({
        ...prev,
        [oldStatus]: prev[oldStatus as keyof typeof prev] - 1,
        [status]: prev[status as keyof typeof prev] + 1
      }));

      toast.success(`Tarea ${status === "completed" ? "completada" : "actualizada"}`);

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task");
    } finally {
      setLoading(false);
    }
  };

  // Delete a task (mark as deleted)
  const deleteTask = async (id: string) => {
    try {
      setLoading(true);
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
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      
      // Update counts
      setTotalTasks(prev => prev - 1);
      setTaskCounts(prev => ({
        ...prev,
        [taskToDelete.status]: prev[taskToDelete.status as keyof typeof prev] - 1
      }));

      // If we deleted the last task on a page that's not the first page,
      // and there are no tasks left on this page, go to the previous page
      if (currentPage > 1 && updatedTasks.length === 0) {
        fetchTasks(currentPage - 1);
      }

      toast.success("Tarea eliminada exitosamente");

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Error deleting task");
    } finally {
      setLoading(false);
    }
  };

  // Start a focus session with a task
  const startFocusSession = async (task: Task) => {
    try {
      setLoading(true);
      
      // First update the task to in_progress status if needed
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

        setTasks(sortTasksByStatus(updatedTasks));

        // Update task counts
        setTaskCounts(prev => ({
          ...prev,
          [task.status]: prev[task.status as keyof typeof prev] - 1,
          in_progress: prev.in_progress + 1
        }));

        // Update the task object to have in_progress status
        task = { ...task, status: "in_progress" };
      }

      // Clear all existing timers and flags
      localStorage.removeItem('timerState');
      localStorage.removeItem('selectedTask');
      localStorage.removeItem('autoStartSession');

      // Set the updated task and auto-start flag in localStorage
      localStorage.setItem('selectedTask', JSON.stringify(task));
      localStorage.setItem('autoStartSession', 'true');

      toast.info(`Preparando sesión de enfoque para: ${task.name}`);

      // Notify parent component
      if (onTasksChanged) {
        onTasksChanged();
      }

      // Navigate to the timer tab
      router.push('/hub/?tab=timer');
    } catch (error) {
      console.error("Error starting focus session:", error);
      toast.error("Error al iniciar la sesión de enfoque");
    } finally {
      setLoading(false);
    }
  };

  // Get status badge component
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
    
    // Ensure at least 1 minute is displayed
    const displayMinutes = Math.max(1, minutes);
    const hours = Math.floor(displayMinutes / 60);
    const mins = displayMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h:${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalTasks / tasksPerPage));

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-md bg-[#262638]">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  // Helper to format completed date nicely
  const formatCompletedDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "";
    }
  };

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
            {countLoading ? (
              <>
                <Skeleton className="h-16 bg-[#262638]" />
                <Skeleton className="h-16 bg-[#262638]" />
                <Skeleton className="h-16 bg-[#262638]" />
              </>
            ) : (
              <>
                <div className="bg-[#262638] p-2 rounded text-center">
                  <span className="text-yellow-400 text-sm">Pendientes</span>
                  <div className="text-white font-semibold">{taskCounts.pending}</div>
                </div>
                <div className="bg-[#262638] p-2 rounded text-center">
                  <span className="text-blue-400 text-sm">En Progreso</span>
                  <div className="text-white font-semibold">{taskCounts.in_progress}</div>
                </div>            
                <div className="bg-[#262638] p-2 rounded text-center">
                  <span className="text-green-400 text-sm">Completadas</span>
                  <div className="text-white font-semibold">{taskCounts.completed}</div>
                </div>
              </>
            )}
          </div>

          {/* Add Task Form */}
          <div className="flex space-x-2">
            <Input
              placeholder="Añadir nueva tarea..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask()}
              className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
              disabled={loading}
            />
            <Button
              onClick={createTask}
              disabled={loading || !newTaskName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Añadir"
              )}
            </Button>
          </div>

          {/* Task List with Loading State */}
          {initialLoading ? (
            renderSkeleton()
          ) : tasks.length > 0 ? (
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
                        disabled={loading}
                      >
                        {task.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      <span className={`text-white ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                        {task.name}
                      </span>
                      {getStatusBadge(task.status)}
                    </div>

                    {/* Show duration and completion date for completed tasks */}
                    {task.status === "completed" && (
                      <div className="ml-8 mt-1 text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Tiempo total: {formatDuration(task.duration_minutes)}
                        {task.completed_at && (
                          <span className="ml-2">
                            • Completada: {formatCompletedDate(task.completed_at)}
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
                      disabled={task.status === "completed" || loading}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading}>
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#262638] border-gray-700 text-white">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                          disabled={task.status === "in_progress"}
                        >
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          <span>Marcar en progreso</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                          disabled={task.status === "completed"}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                          <span>Marcar completada</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTaskStatus(task.id, "pending")}
                          className="flex items-center cursor-pointer hover:bg-gray-700"
                          disabled={task.status === "pending"}
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
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