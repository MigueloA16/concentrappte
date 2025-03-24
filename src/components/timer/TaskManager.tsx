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
import { Play, MoreVertical, Check, Clock, LayoutGrid, Trash, CheckCircle2, XCircle } from "lucide-react";
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
};

type TaskManagerProps = {
  tasks: Task[];
  onTasksChanged?: () => void; // New callback prop
};

export default function TaskManager({ tasks: initialTasks = [], onTasksChanged }: TaskManagerProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskName, setNewTaskName] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep tasks in sync with initialTasks prop (useful when parent component refreshes data)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
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
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== id));
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
      // Save the task to localStorage to be picked up by the timer component
      localStorage.setItem('selectedTask', JSON.stringify(task));
      
      // Redirect to the timer tab or use any mechanism your app has for switching to the timer
      toast.info(`Iniciando sesión de enfoque para: ${task.name}`);
      
      // For Next.js - redirecting to the timer tab
      // You'll need to adapt this to your app's navigation structure
      router.push('/hub/?tab=timer');
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
              {loading ? "Añadiendo..." : "Añadir"}
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
        </div>
      </CardContent>
      
      {tasks.length > 0 && (
        <CardFooter className="border-t border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between w-full text-sm text-gray-400">
            <div>Total: {tasks.length} tareas</div>
            <div>
              Completadas: {tasks.filter(t => t.status === "completed").length} / {tasks.length}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}