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
import { Task } from "@/lib/supabase/database.types"; // Ensure this path is correct
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
  const [loading, setLoading] = useState(false); // General loading state for operations
  const [initialLoading, setInitialLoading] = useState(true); // Loading state for initial data fetch (counts + first page)
  const [countLoading, setCountLoading] = useState(true); // Specific loading state for counts

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

  // Fetch task counts and total count
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const fetchTaskCounts = async () => {
      try {
        if (!isMounted) return;
        setCountLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setCountLoading(false); // Ensure loading stops if no user
          return;
        }

        const { data, error, count } = await supabase
          .from("tasks")
          .select("status", { count: 'exact', head: false })
          .eq("user_id", user.id)
          .eq("deleted", false);

        if (!isMounted) return; // Check again after async call

        if (error) throw error;

        const counts = { in_progress: 0, pending: 0, completed: 0 };
        data.forEach(task => {
          if (task.status in counts) {
            counts[task.status as keyof typeof counts]++;
          }
        });

        setTaskCounts(counts);
        setTotalTasks(count ?? 0);
      } catch (error) {
        console.error("Error fetching task counts:", error);
        if (isMounted) toast.error("Error fetching task counts");
      } finally {
        if (isMounted) setCountLoading(false);
      }
    };
    fetchTaskCounts();

    return () => { isMounted = false }; // Cleanup function
  }, []); // Run once on mount

  // Initialize task list from props and handle combined initial loading state
  useEffect(() => {
    if (initialTasks?.length > 0) {
      const filteredTasks = initialTasks.filter(task => !task.deleted);
      setTasks(sortTasksByStatus(filteredTasks));
    }
    // Set initialLoading to true if either counts are loading OR initialTasks haven't arrived yet
    setInitialLoading(countLoading || initialTasks === undefined);
  }, [initialTasks, countLoading]); // Depend on both props and count loading state

  // Fetch tasks for a specific page
  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // First fetch in_progress tasks
      const { data: inProgressTasks, error: progressError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false });

      if (progressError) throw progressError;

      // Then fetch pending tasks
      const { data: pendingTasks, error: pendingError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;

      // Finally fetch completed tasks
      const { data: completedTasks, error: completedError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (completedError) throw completedError;

      // Combine all tasks in the correct order
      const allSortedTasks = [
        ...(inProgressTasks || []),
        ...(pendingTasks || []),
        ...(completedTasks || [])
      ];

      // Set the total count
      setTotalTasks(allSortedTasks.length);

      // Paginate in memory
      const startIndex = (page - 1) * tasksPerPage;
      const tasksForPage = allSortedTasks.slice(startIndex, startIndex + tasksPerPage);

      setTasks(tasksForPage);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch first page if initial tasks are empty but count suggests there should be some
  useEffect(() => {
    // Only run if initial loading is finished, task list is empty, and total count > 0
    if (!initialLoading && tasks.length === 0 && totalTasks > 0) {
      fetchTasks(1);
    }
  }, [initialLoading, tasks, totalTasks]); // Dependencies


  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || loading) return; // Add check for loading
    fetchTasks(newPage);
  };

  // Create a new task
  const createTask = async () => {
    if (!newTaskName.trim()) {
      toast.error("Por favor ingresa un nombre para la tarea");
      return;
    }
    if (loading) return; // Prevent double submission
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tasks")
        .insert({
          name: newTaskName.trim(), status: "pending", user_id: user.id,
          deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })
        .select().single(); // No need to capture 'data' if just refetching

      if (error) throw error;

      // Optimistically update counts before refetch
      setTotalTasks(prev => prev + 1);
      setTaskCounts(prev => ({ ...prev, pending: prev.pending + 1 }));

      // Refetch page 1 to ensure correct order and pagination
      await fetchTasks(1); // Await the fetch before clearing input/toast

      setNewTaskName("");
      toast.success("Tarea creada exitosamente");
      if (onTasksChanged) onTasksChanged();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Error creating task");
    } finally {
      setLoading(false);
    }
  };

  // Update a task's status
  const updateTaskStatus = async (id: string, status: string) => {
    if (loading) return; // Prevent concurrent updates
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate || taskToUpdate.status === status) return; // No change needed

    setLoading(true);
    const oldStatus = taskToUpdate.status;
    try {
      const updates: Partial<Task> = { status, updated_at: new Date().toISOString() };

      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
        // Fetch duration only when marking complete
        const { data: taskSessions, error: sessionsError } = await supabase
          .from("focus_sessions").select("duration_minutes")
          .eq("task_id", id).eq("is_completed", true);
        if (sessionsError) throw sessionsError;
        const totalDuration = taskSessions?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
        updates.duration_minutes = Math.max(1, totalDuration); // Ensure at least 1 minute
      } else {
        updates.completed_at = null; // Reset completion date if moving away from completed
        // Optionally reset duration if needed: updates.duration_minutes = null;
      }

      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;

      // Update local state
      const updatedTasks = tasks.map(task => task.id === id ? { ...task, ...updates } : task);
      setTasks(sortTasksByStatus(updatedTasks));

      // Update counts
      setTaskCounts(prev => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus as keyof typeof prev] - 1),
        [status]: prev[status as keyof typeof prev] + 1
      }));

      toast.success(`Tarea ${status === "completed" ? "completada" : "actualizada"}`);
      if (onTasksChanged) onTasksChanged();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Error updating task");
    } finally {
      setLoading(false);
    }
  };

  // Delete a task (mark as deleted)
  const deleteTask = async (id: string) => {
    if (loading) return; // Prevent concurrent deletes
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) return;

    setLoading(true);
    const oldStatus = taskToDelete.status;
    try {
      const { error } = await supabase.from("tasks")
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Optimistically update UI and counts
      const updatedTasks = tasks.filter(task => task.id !== id);
      const newTotalTasks = Math.max(0, totalTasks - 1);

      setTasks(updatedTasks);
      setTotalTasks(newTotalTasks);
      setTaskCounts(prev => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus as keyof typeof prev] - 1)
      }));

      // Refetch logic after deletion
      if (updatedTasks.length === 0 && newTotalTasks > 0 && currentPage > 1) {
        // If last item on a page > 1, go to previous page
        await fetchTasks(currentPage - 1);
      } else if (tasks.length - updatedTasks.length > 0 && newTotalTasks >= (currentPage - 1) * tasksPerPage + 1) {
        // If an item was removed and the current page might need refilling
        await fetchTasks(currentPage);
      }
      // If it was the very last task overall, no refetch needed, empty state will show.


      toast.success("Tarea eliminada exitosamente");
      if (onTasksChanged) onTasksChanged();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(error.message || "Error deleting task");
    } finally {
      setLoading(false);
    }
  };

  // Start a focus session with a task
  const startFocusSession = async (task: Task) => {
    if (loading || task.status === 'completed') return; // Prevent if loading or already completed
    setLoading(true);
    try {
      let currentTaskState = tasks.find(t => t.id === task.id) || task;
      const oldStatus = currentTaskState.status;

      // Update status to 'in_progress' if it's not already
      if (currentTaskState.status !== "in_progress") {
        const { error } = await supabase.from("tasks")
          .update({ status: "in_progress", updated_at: new Date().toISOString(), completed_at: null })
          .eq("id", task.id);
        if (error) throw error;

        // Update local state immediately
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: "in_progress", updated_at: new Date().toISOString(), completed_at: null } : t);
        setTasks(sortTasksByStatus(updatedTasks));

        // Update counts
        if (oldStatus !== 'in_progress') {
          setTaskCounts(prev => ({
            ...prev,
            [oldStatus]: Math.max(0, prev[oldStatus as keyof typeof prev] - 1),
            in_progress: prev.in_progress + 1
          }));
        }
        currentTaskState = { ...currentTaskState, status: "in_progress", completed_at: null }; // Use updated state for localStorage
      }

      // Prepare for navigation
      localStorage.removeItem('timerState');
      localStorage.removeItem('selectedTask');
      localStorage.removeItem('autoStartSession');
      localStorage.setItem('selectedTask', JSON.stringify(currentTaskState));
      localStorage.setItem('autoStartSession', 'true');
      toast.info(`Preparando sesión de enfoque para: ${currentTaskState.name}`);
      if (onTasksChanged) onTasksChanged();
      router.push('/hub/?tab=timer'); // Navigate after state updates
    } catch (error: any) {
      console.error("Error starting focus session:", error);
      toast.error(error.message || "Error al iniciar la sesión de enfoque");
      setLoading(false); // Ensure loading is false on error before navigation
    }
    // setLoading(false) is not called here on success because the component will unmount/remount on navigation
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="outline" className="border-green-600 text-green-400 flex-shrink-0">Completada</Badge>;
      case "in_progress": return <Badge variant="outline" className="border-blue-600 text-blue-400 animate-pulse flex-shrink-0">En progreso</Badge>;
      case "pending": return <Badge variant="outline" className="border-yellow-600 text-yellow-400 flex-shrink-0">Pendiente</Badge>;
      default: return <Badge variant="secondary" className="flex-shrink-0">{status}</Badge>;
    }
  };

  // Format duration
  const formatDuration = (minutes: number | undefined | null) => {
    if (minutes === undefined || minutes === null || minutes < 0) return "N/A";
    const displayMinutes = Math.max(1, Math.round(minutes));
    const hours = Math.floor(displayMinutes / 60);
    const mins = displayMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format completed date
  const formatCompletedDate = (dateString: string | null) => {
    if (!dateString) return "";
    try { return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return "Invalid Date"; }
  };

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalTasks / tasksPerPage));

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(tasksPerPage)].map((_, index) => ( // Render based on tasksPerPage
        <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-y-2 sm:gap-x-3 p-3 rounded-md bg-[#262638]">
          {/* Mobile Row 1 Skeleton / Desktop Right Skeleton */}
          <div className="flex justify-end items-center space-x-1 sm:order-2">
            <Skeleton className="h-5 w-16 rounded-full sm:order-first sm:mr-2" /> {/* Status Badge Skeleton */}
            <Skeleton className="h-8 w-8 rounded-md" /> {/* Button Skeleton */}
            <Skeleton className="h-8 w-8 rounded-md" /> {/* Button Skeleton */}
          </div>
          {/* Mobile Row 2 Skeleton / Desktop Left Skeleton */}
          <div className="flex-1 min-w-0 space-y-2 sm:order-1">
            <Skeleton className="h-5 w-4/5" /> {/* Task Name Skeleton */}
            <Skeleton className="h-3 w-3/5" /> {/* Details Skeleton */}
          </div>
        </div>
      ))}
    </div>
  );


  return (
    <Card className="w-full bg-[#1a1a2e] border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-white">Administra Tus Tareas</CardTitle>
        <CardDescription className="text-gray-400">
          Organiza tus actividades y mantente enfocado en tus objetivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Task Counts */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {countLoading ? (
              // Render skeletons while count is loading
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={`count-skel-${i}`} className="h-16 bg-[#262638]" />)
            ) : (
              // Render actual counts
              <>
                <div className="bg-[#262638] p-3 rounded text-center">
                  <span className="text-yellow-400 text-xs sm:text-sm font-medium">Pendientes</span>
                  <div className="text-white text-lg sm:text-xl font-semibold">{taskCounts.pending}</div>
                </div>
                <div className="bg-[#262638] p-3 rounded text-center">
                  <span className="text-blue-400 text-xs sm:text-sm font-medium">En Progreso</span>
                  <div className="text-white text-lg sm:text-xl font-semibold">{taskCounts.in_progress}</div>
                </div>
                <div className="bg-[#262638] p-3 rounded text-center">
                  <span className="text-green-400 text-xs sm:text-sm font-medium">Completadas</span>
                  <div className="text-white text-lg sm:text-xl font-semibold">{taskCounts.completed}</div>
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
              onKeyDown={(e) => e.key === "Enter" && !loading && newTaskName.trim() && createTask()}
              className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:ring-offset-[#1a1a2e]"
              disabled={loading} // Disable input during any operation
            />
            <Button
              onClick={createTask}
              disabled={loading || !newTaskName.trim()} // Disable button during any operation or if input empty
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir"}
            </Button>
          </div>

          {/* Task List */}
          {initialLoading ? (
            // Show skeleton during combined initial load (counts + initial tasks)
            renderSkeleton()
          ) : tasks.length > 0 ? (
            // Render tasks if available
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  // Main container: Mobile=Column, Desktop=Row. Adjust gap.
                  className={`
                    flex flex-col sm:flex-row sm:justify-between gap-y-2 sm:gap-x-3 p-3 rounded-md
                    ${task.status === 'in_progress' ? 'bg-[#1E293B]' : 'bg-[#262638]'}
                    border-l-4 ${task.status === 'in_progress' ? 'border-blue-500' : 'border-transparent'}
                    transition-colors duration-150 ease-in-out
                  `}
                >
                  {/* === Mobile Row 1 / Desktop Right Section === */}
                  {/* UPDATED: Use justify-between to separate Badge and Buttons */}
                  <div className={`flex justify-between items-center sm:order-2 sm:space-x-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Status Badge: Left on mobile (by default in justify-between). First on desktop (via order-first). */}
                    <div className="sm:order-first sm:mr-2"> {/* mr-2 only affects desktop */}
                      {getStatusBadge(task.status)}
                    </div>

                    {/* Action Buttons Group: Right on mobile (by justify-between). After badge on desktop. */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost" size="sm" onClick={() => startFocusSession(task)}
                        className={`h-8 w-8 p-0 flex-shrink-0 ${task.status === "completed" ? "text-gray-600 cursor-not-allowed" : "text-green-400 hover:text-green-300 hover:bg-green-900/30"}`}
                        disabled={task.status === "completed" || loading}
                        aria-label="Start focus session"
                      >
                        <Play className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 flex-shrink-0" disabled={loading} aria-label="More actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2a2a3f] border-gray-700 text-white shadow-lg">
                          <DropdownMenuLabel className="text-sm font-medium">Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-gray-600" />
                          {/* Mark In Progress */}
                          <DropdownMenuItem
                            onClick={() => updateTaskStatus(task.id, "in_progress")}
                            className={`flex items-center cursor-pointer text-sm px-2 py-1.5 rounded hover:bg-[#3a3a52] ${task.status === "in_progress" || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={task.status === "in_progress" || loading}
                          >
                            <Clock className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
                            <span>Marcar en progreso</span>
                          </DropdownMenuItem>
                          {/* Mark Completed */}
                          <DropdownMenuItem
                            onClick={() => updateTaskStatus(task.id, "completed")}
                            className={`flex items-center cursor-pointer text-sm px-2 py-1.5 rounded hover:bg-[#3a3a52] ${task.status === "completed" || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={task.status === "completed" || loading}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                            <span>Marcar completada</span>
                          </DropdownMenuItem>
                          {/* Mark Pending */}
                          <DropdownMenuItem
                            onClick={() => updateTaskStatus(task.id, "pending")}
                            className={`flex items-center cursor-pointer text-sm px-2 py-1.5 rounded hover:bg-[#3a3a52] ${task.status === "pending" || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={task.status === "pending" || loading}
                          >
                            <XCircle className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                            <span>Marcar pendiente</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-600" />
                          {/* Delete */}
                          <DropdownMenuItem
                            onClick={() => deleteTask(task.id)}
                            className={`flex items-center cursor-pointer text-sm px-2 py-1.5 rounded text-red-400 hover:bg-red-900/40 hover:text-red-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div> {/* End Action Buttons Group */}
                  </div> {/* End Mobile Row 1 / Desktop Right Section */}


                  {/* === Mobile Row 2 / Desktop Left Section === */}
                  {/* (This section remains unchanged) */}
                  <div className="flex-1 min-w-0 sm:order-1">
                    {/* Task Name */}
                    <span className={`text-sm sm:text-base font-medium break-words block ${task.status === "completed" ? "line-through text-gray-400" : "text-white"}`}>
                      {task.name}
                    </span>

                    {/* Additional Task Info */}
                    {(task.status === "completed" || task.status === "in_progress") && (
                      <div className="mt-1.5 text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {task.status === "completed" && (
                          <>
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1 flex-shrink-0" />Tiempo: {formatDuration(task.duration_minutes)}</span>
                            {task.completed_at && <span className="flex items-center"><CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0 text-green-500" />{formatCompletedDate(task.completed_at)}</span>}
                          </>
                        )}
                        {task.status === "in_progress" && <span className="text-blue-400 flex items-center"><AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />En sesión de enfoque</span>}
                      </div>
                    )}
                  </div>

                </div> // End Task Item Div
              ))}
            </div> // End Task List Container
          ) : (
            // Empty State: Rendered when not initialLoading and tasks.length is 0
            <div className="text-center py-16 text-gray-500">
              <LayoutGrid className="h-16 w-16 mx-auto mb-6 opacity-10" />
              <p className="text-lg font-semibold text-gray-400">No hay tareas aquí</p>
              <p className="mt-2 text-sm">Añade tu primera tarea arriba para empezar.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-6">
              <Button
                variant="outline" size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-400 font-medium px-2">
                Página {currentPage} <span className="hidden sm:inline">de {totalPages}</span>
              </span>
              <Button
                variant="outline" size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="h-8 w-8 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      {totalTasks > 0 && !initialLoading && ( // Show footer only if tasks exist and initial load is done
        <CardFooter className="border-t border-gray-800 px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs sm:text-sm text-gray-400 gap-1 sm:gap-4">
            <span>Total: <span className="font-semibold text-gray-300">{totalTasks}</span> {totalTasks === 1 ? 'tarea' : 'tareas'}</span>
            <span className="hidden sm:inline">•</span>
            <span><span className="font-semibold text-green-400">{taskCounts.completed}</span> Completadas</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}