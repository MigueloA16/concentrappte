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
import { Play, MoreVertical, Check, Clock, LayoutGrid, Trash, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Get total task count on initial load
  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
          .from("tasks")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .eq("deleted", false);

        if (error) throw error;
        setTotalTasks(count || 0);
      } catch (error) {
        console.error("Error fetching task count:", error);
      }
    };

    fetchTaskCount();
  }, []);

  // Fetch tasks based on current page
  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate offset for pagination
      const offset = (page - 1) * tasksPerPage;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + tasksPerPage - 1);

      if (error) throw error;
      setTasks(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  // Handle page changes
  const goToPage = (page: number) => {
    fetchTasks(page);
  };

  // Keep tasks in sync with initialTasks prop for the first page
  useEffect(() => {
    if (currentPage === 1) {
      setTasks(initialTasks);
    }
  }, [initialTasks, currentPage]);

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
      
      // If we're on the first page, add the task to the list
      if (currentPage === 1) {
        // Add the new task at the beginning and remove the last one if more than tasksPerPage
        const updatedTasks = [data, ...tasks];
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
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === "completed" ? { completed_at: new Date().toISOString() } : {})
        })
        .eq("id", id);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === id ? { ...task, status, updated_at: new Date().toISOString() } : task
      ));
      
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
      const { error } = await supabase
        .from("tasks")
        .update({ 
          deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== id));
      setTotalTasks(prev => prev - 1);
      
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

  const startFocusSession = (task: Task) => {
    try {
      // First clear all existing timers and flags
      localStorage.removeItem('timerState');
      localStorage.removeItem('selectedTask');
      localStorage.removeItem('autoStartSession');
      
      // Then set our task and auto-start flag
      localStorage.setItem('selectedTask', JSON.stringify(task));
      localStorage.setItem('autoStartSession', 'true');
      
      // Notify the user
      toast.info(`Preparando sesión de enfoque para: ${task.name}`);
      
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
        return <Badge className="bg-blue-600 hover:bg-blue-700">En progreso</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-600 hover:bg-gray-700">{status}</Badge>;
    }
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
                  className="flex items-center justify-between bg-[#262638] p-3 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                      className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        task.status === "completed" ? "bg-green-600 text-white" : "border border-gray-500"
                      }`}
                    >
                      {task.status === "completed" && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`text-white ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                      {task.name}
                    </span>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => startFocusSession(task)}
                      className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
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
            Completadas: {tasks.filter(t => t.status === "completed").length} / {tasks.length} (en esta página)
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}