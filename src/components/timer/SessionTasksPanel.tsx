"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    CheckCircle2,
    XCircle,
    Trash,
    Clock,
    Play,
    Pause,
    MoreVertical,
    PlusCircle,
    Loader2,
    ChevronUp,
    ChevronDown,
    ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Task } from "@/lib/supabase/database.types";

interface SessionTasksPanelProps {
    isActiveSession: boolean;
    onTaskStatusChange?: () => void;
    isSessionCompleted?: boolean;
}

// Track task time in this component
type TaskTimeTracking = {
    taskId: string;
    startTime: Date | null;
    lastUpdatedSeconds: number;
    totalSeconds: number;
    isTracking: boolean;
};

const SessionTasksPanel: React.FC<SessionTasksPanelProps> = ({
    onTaskStatusChange,
    isSessionCompleted = false
}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [newTaskName, setNewTaskName] = useState("");
    const [showNewTaskInput, setShowNewTaskInput] = useState(false);
    const [taskTimeTracking, setTaskTimeTracking] = useState<TaskTimeTracking[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile screen size
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        // Initial check
        checkIsMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Fetch available tasks
    useEffect(() => {
        fetchTasks();

        // Clean up any existing interval first
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        // Set up a timer to update task times
        timerIntervalRef.current = setInterval(() => {
            updateTaskTimes();
        }, 1000);

        // Cleanup on component unmount
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, []);

    // Update tracking times for tasks
    const updateTaskTimes = () => {
        setTaskTimeTracking(prev => {
            const updated = prev.map(taskTime => {
                if (taskTime.isTracking) {
                    // Calculate time based on the elapsed time since startTime
                    // This ensures tracking continues even when switching tabs
                    if (taskTime.startTime) {
                        const now = new Date();
                        const elapsedSeconds = Math.floor((now.getTime() - taskTime.startTime.getTime()) / 1000);
                        const startSeconds = taskTime.totalSeconds - (taskTime.lastUpdatedSeconds || 0);

                        return {
                            ...taskTime,
                            totalSeconds: startSeconds + elapsedSeconds,
                            lastUpdatedSeconds: elapsedSeconds
                        };
                    } else {
                        // If no startTime, just increment by 1 as a fallback
                        return {
                            ...taskTime,
                            totalSeconds: taskTime.totalSeconds + 1
                        };
                    }
                }
                return taskTime;
            });

            // Save updated data to localStorage
            saveTimingData(updated);

            return updated;
        });
    };

    // Format seconds to mm:ss
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Fetch tasks from Supabase
    const fetchTasks = async () => {
        try {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Get all non-deleted, non-completed tasks
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", user.id)
                .eq("deleted", false)
                .in("status", ["pending", "in_progress"])
                .order("created_at", { ascending: false });

            if (error) throw error;

            setTasks(data || []);

            // Load saved timing data
            const savedTimingData = loadSavedTimingData();

            // Initialize time tracking for each task, merging with saved data
            const initialTracking = (data || []).map(task => {
                // Check if we have saved timing data for this task
                const savedData = savedTimingData.find(t => t.taskId === task.id);

                if (savedData) {
                    return savedData; // Use the saved data with timing info
                }

                // Otherwise create new tracking entry
                return {
                    taskId: task.id,
                    startTime: null,
                    totalSeconds: 0,
                    isTracking: false,
                    lastUpdatedSeconds: 0
                };
            });

            setTaskTimeTracking(initialTracking);

        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Error loading tasks");
        } finally {
            setLoading(false);
        }
    };

    // Create a new task
    const createTask = async () => {
        if (!newTaskName.trim()) {
            toast.error("Ingrese el nombre de la tarea");
            return;
        }

        try {
            setActionLoading(true);

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

            // Add new task to state
            setTasks([data, ...tasks]);

            // Add time tracking for the new task
            setTaskTimeTracking([
                {
                    taskId: data.id,
                    startTime: null,
                    totalSeconds: 0,
                    isTracking: false,
                    lastUpdatedSeconds: 0
                },
                ...taskTimeTracking
            ]);

            setNewTaskName("");
            setShowNewTaskInput(false);
            toast.success("Tarea Creada");

            // Notify parent
            if (onTaskStatusChange) {
                onTaskStatusChange();
            }

        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Error creando la tarea");
        } finally {
            setActionLoading(false);
        }
    };

    // Update task status
    const updateTaskStatus = async (id: string, status: string) => {
        try {
            setActionLoading(true);

            const taskToUpdate = tasks.find(task => task.id === id);
            if (!taskToUpdate) return;

            const updates: any = {
                status,
                updated_at: new Date().toISOString()
            };

            // Add completed_at timestamp if marking as completed
            if (status === "completed") {
                updates.completed_at = new Date().toISOString();

                // Get the current tracking time for this task
                const tracking = taskTimeTracking.find(t => t.taskId === id);

                // Calculate minutes from tracked seconds
                const trackingMinutes = tracking ? Math.ceil(tracking.totalSeconds / 60) : 0;

                // Add at least 1 minute if there was any tracking time
                if (tracking && tracking.totalSeconds >= 0) {
                    const additionalMinutes = Math.max(1, trackingMinutes);

                    // Get current task duration
                    const { data: taskData, error: taskFetchError } = await supabase
                        .from("tasks")
                        .select("duration_minutes")
                        .eq("id", id)
                        .single();

                    if (taskFetchError) {
                        console.error("Error fetching task duration:", taskFetchError);
                    }

                    const currentDuration = (taskData?.duration_minutes || 0);

                    updates.duration_minutes = Math.max(1, currentDuration + additionalMinutes);
                }

                // Always stop tracking this task when completed
                if (tracking && tracking.isTracking) {
                    setTaskTimeTracking(prev =>
                        prev.map(t => t.taskId === id ? { ...t, isTracking: false } : t)
                    );
                }
            }

            // First update the database
            const { error } = await supabase
                .from("tasks")
                .update(updates)
                .eq("id", id);

            if (error) throw error;

            if (status === "completed") {
                // Then update local state to remove the completed task from the list
                setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
                setTaskTimeTracking(prevTracking => prevTracking.filter(t => t.taskId !== id));

                toast.success("Tarea completada");
            } else {
                // Update the task status in the list
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === id ? { ...task, status, updated_at: new Date().toISOString() } : task
                    )
                );

                toast.success("Tarea actualizada");
            }

            // Notify parent
            if (onTaskStatusChange) {
                onTaskStatusChange();
            }

        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Error actualizando la tarea");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete a task
    const deleteTask = async (id: string) => {
        try {
            setActionLoading(true);

            // First update in database
            const { error } = await supabase
                .from("tasks")
                .update({
                    deleted: true,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;

            // Then update local state
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
            setTaskTimeTracking(prevTracking => prevTracking.filter(t => t.taskId !== id));

            toast.success("Tarea eliminada");

            // Notify parent
            if (onTaskStatusChange) {
                onTaskStatusChange();
            }

        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Error deleting task");
        } finally {
            setActionLoading(false);
        }
    };

    const loadSavedTimingData = () => {
        try {
            const savedData = localStorage.getItem('taskTimeTracking');
            if (savedData) {
                const parsedData = JSON.parse(savedData);

                // Validate the data structure
                if (Array.isArray(parsedData)) {
                    // Convert string dates back to Date objects if needed
                    const processedData = parsedData.map(item => ({
                        ...item,
                        startTime: item.startTime ? new Date(item.startTime) : null
                    }));

                    return processedData;
                }
            }
        } catch (error) {
            console.error("Error loading saved timing data:", error);
        }
        return [];
    };

    // Save timing data to localStorage
    const saveTimingData = (data: TaskTimeTracking[]) => {
        try {
            localStorage.setItem('taskTimeTracking', JSON.stringify(data));
        } catch (error) {
            console.error("Error saving timing data:", error);
        }
    };

    // Start/stop time tracking for a task
    const toggleTaskTracking = async (taskId: string) => {
        // Find the task to toggle
        const taskToToggle = taskTimeTracking.find(t => t.taskId === taskId);
        if (!taskToToggle) return;

        // If starting tracking, update task status to in_progress
        if (!taskToToggle.isTracking) {
            try {
                const { error } = await supabase
                    .from("tasks")
                    .update({
                        status: "in_progress",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", taskId);

                if (error) throw error;

                // Update local task state
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, status: "in_progress" }
                            : task
                    )
                );

                // Notify parent
                if (onTaskStatusChange) {
                    onTaskStatusChange();
                }
            } catch (error) {
                console.error("Error updating task status:", error);
                toast.error("Error updating task");
                return;
            }
        }

        // Update tracking state - preserve totalSeconds when pausing
        setTaskTimeTracking(prev => {
            const updated = prev.map(t => {
                if (t.taskId === taskId) {
                    const newState = {
                        ...t,
                        isTracking: !t.isTracking,
                        startTime: !t.isTracking ? new Date() : null
                    };
                    return newState;
                }
                return t;
            });

            // Save updated data to localStorage
            saveTimingData(updated);

            return updated;
        });

        toast.info(
            taskToToggle.isTracking
                ? "Tiempo de tarea pausado"
                : "Tiempo de tarea iniciado"
        );
    };

    // Get status badge component
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "in_progress":
                return <Badge className="bg-blue-400 hover:bg-blue-500 animate-pulse">En progreso</Badge>;
            case "pending":
                return <Badge className="bg-yellow-400 hover:bg-yellow-500">Pendiente</Badge>;
            default:
                return <Badge className="bg-gray-400 hover:bg-gray-500">{status}</Badge>;
        }
    };

    // Toggle expand/collapse
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (loading) {
        return (
            <div className="w-full">
                <div className="bg-[#262638] rounded-lg shadow-lg border border-gray-800">
                    <div className="flex items-center justify-between p-3 cursor-pointer">
                        <h3 className="text-sm font-medium text-white flex items-center">
                            <ListChecks className="h-4 w-4 mr-2 text-purple-400" />
                            Administrar Tareas
                        </h3>
                        <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="bg-[#262638] rounded-lg shadow-lg border border-gray-800">
                {/* Header - always visible */}
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800/30 rounded-t-lg bg-[#1E1E32]"
                    onClick={toggleExpanded}
                >
                    <h3 className="text-sm font-medium text-white flex items-center">
                        <ListChecks className="h-4 w-4 mr-2 text-purple-400" />
                        Administrar Tareas {tasks.length > 0 && <span className="ml-1 text-xs text-gray-400">({tasks.length})</span>}
                    </h3>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                </div>

                {/* Content - only visible when expanded */}
                {isExpanded && (
                    <div className="p-3 pt-0 border-t border-gray-800">
                        {/* Add new task button */}
                        <div className="mb-2 flex justify-between items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowNewTaskInput(!showNewTaskInput)}
                                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                                disabled={actionLoading}
                            >
                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                Nueva Tarea
                            </Button>
                            <span className="text-xs text-gray-500">{tasks.length} pendientes</span>
                        </div>

                        {/* New task input */}
                        {showNewTaskInput && (
                            <div className="mb-3 flex space-x-2">
                                <Input
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    placeholder="Nombre de la tarea"
                                    className="text-xs h-8 bg-[#1a1a2e] border-gray-700 text-white placeholder:text-gray-500"
                                    onKeyDown={(e) => e.key === "Enter" && createTask()}
                                    disabled={actionLoading}
                                />
                                <Button
                                    size="sm"
                                    className="h-8 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                                    onClick={createTask}
                                    disabled={actionLoading || !newTaskName.trim()}
                                >
                                    {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Añadir"}
                                </Button>
                            </div>
                        )}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {tasks.length > 0 ? (
                                tasks.map((task) => {
                                    // Find tracking info for this task
                                    const tracking = taskTimeTracking.find(t => t.taskId === task.id);
                                    const isTracking = tracking?.isTracking || false;

                                    return (
                                        <div
                                            key={task.id}
                                            className="py-2 px-2 rounded-md bg-[#1a1a2e]"
                                        >
                                            {/* Mobile Layout */}
                                            {isMobile && (
                                                <div className="flex flex-col text-xs">
                                                    {/* First Row: Status Badge and Action Buttons */}
                                                    <div className="flex justify-between mb-2">
                                                        <div className="flex items-center">
                                                            {getStatusBadge(task.status)}
                                                            {tracking && isTracking && (
                                                                <div className="text-blue-400 ml-2 flex">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    <span>{formatTime(tracking.totalSeconds)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Action Buttons */}
                                                        <div className="flex space-x-1 ml-auto">
                                                            {/* Mark as completed */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => updateTaskStatus(task.id, "completed")}
                                                                className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                                disabled={actionLoading}
                                                                title="Mark as completed"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </Button>

                                                            {/* Toggle time tracking */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleTaskTracking(task.id)}
                                                                className={`h-7 w-7 p-0 ${isTracking
                                                                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                                                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                                                    }`}
                                                                disabled={actionLoading || isSessionCompleted}
                                                                title={isTracking ? "Pause tracking" : "Start tracking"}
                                                            >
                                                                {isTracking ? (
                                                                    <Pause className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <Play className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>

                                                            {/* More options dropdown */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-300"
                                                                        disabled={actionLoading}
                                                                    >
                                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-[160px] bg-[#262638] border-gray-700 text-white text-xs"
                                                                >
                                                                    <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator className="bg-gray-700" />

                                                                    {/* Status update options based on current status */}
                                                                    {task.status === "pending" && (
                                                                        <DropdownMenuItem
                                                                            className="cursor-pointer flex items-center hover:bg-gray-700 text-xs"
                                                                            onClick={() => updateTaskStatus(task.id, "in_progress")}
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                                                            <span>Marcar en progreso</span>
                                                                        </DropdownMenuItem>
                                                                    )}

                                                                    {task.status === "in_progress" && (
                                                                        <DropdownMenuItem
                                                                            className="cursor-pointer flex items-center hover:bg-gray-700 text-xs"
                                                                            onClick={() => updateTaskStatus(task.id, "pending")}
                                                                        >
                                                                            <XCircle className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                                                                            <span>Marcar pendiente</span>
                                                                        </DropdownMenuItem>
                                                                    )}

                                                                    <DropdownMenuSeparator className="bg-gray-700" />

                                                                    {/* Delete option */}
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer flex items-center text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs"
                                                                        onClick={() => deleteTask(task.id)}
                                                                    >
                                                                        <Trash className="h-3.5 w-3.5 mr-2" />
                                                                        <span>Eliminar</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    {/* Second Row: Task Name */}
                                                    <div className="font-medium text-white break-words text-left pr-2">{task.name}</div>
                                                </div>
                                            )}
                                            {/* Desktop Layout */}
                                            {!isMobile && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="break-words">{task.name}</span>
                                                            {getStatusBadge(task.status)}
                                                        </div>

                                                        {/* Show tracking time if tracking */}
                                                        {tracking && tracking.isTracking && (
                                                            <div className="text-xs text-blue-400 mt-1 flex items-center">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                <span>Tiempo: {formatTime(tracking?.totalSeconds || 0)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 ml-2">
                                                        {/* Toggle time tracking button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTaskTracking(task.id)}
                                                            className={`h-7 w-7 p-0 ${tracking?.isTracking
                                                                ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                                                : "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                                                }`}
                                                            disabled={actionLoading || isSessionCompleted}
                                                            title={tracking?.isTracking ? "Pause tracking" : "Start tracking"}
                                                        >
                                                            {tracking?.isTracking ? (
                                                                <Pause className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Play className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>

                                                        {/* Complete task button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateTaskStatus(task.id, "completed")}
                                                            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                            disabled={actionLoading}
                                                            title="Mark as completed"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        </Button>

                                                        {/* Action menu */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-300"
                                                                    disabled={actionLoading}
                                                                >
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-[160px] bg-[#262638] border-gray-700 text-white text-xs"
                                                            >
                                                                <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="bg-gray-700" />

                                                                {/* Status update options based on current status */}
                                                                {task.status === "pending" && (
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer flex items-center hover:bg-gray-700 text-xs"
                                                                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                                                                    >
                                                                        <Clock className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                                                        <span>Marcar en progreso</span>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {task.status === "in_progress" && (
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer flex items-center hover:bg-gray-700 text-xs"
                                                                        onClick={() => updateTaskStatus(task.id, "pending")}
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                                                                        <span>Marcar pendiente</span>
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuSeparator className="bg-gray-700" />

                                                                {/* Delete option */}
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer flex items-center text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs"
                                                                    onClick={() => deleteTask(task.id)}
                                                                >
                                                                    <Trash className="h-3.5 w-3.5 mr-2" />
                                                                    <span>Eliminar</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-3 text-gray-400 text-xs">
                                    <p>No hay tareas pendientes</p>
                                    <p className="mt-1">Crea una nueva tarea para empezar</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionTasksPanel;