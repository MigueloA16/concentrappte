"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  XCircle,
  Coffee,
  RotateCcw,
  Loader2,
  ListChecks,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import CompactTaskSelection from "./CompactTaskSelection";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { Task } from "@/lib/supabase/database.types";
import { Skeleton } from "@/components/ui/skeleton";

type FocusTimerProps = {
  defaultFocusTime: number;
  defaultBreakLength: number;
  defaultTargetSessions: number;
  recentTasks: Task[];
  techniqueId?: string;
  onSessionComplete?: () => void;
  onTaskStatusChange?: () => void;
};

// Define a type for session tasks
type SessionTask = {
  taskId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  completed: boolean;
};

export default function FocusTimer({
  defaultFocusTime = 25,
  defaultBreakLength = 5,
  defaultTargetSessions = 4,
  recentTasks = [],
  techniqueId = "custom",
  onSessionComplete,
  onTaskStatusChange
}: FocusTimerProps) {
  const [minutes, setMinutes] = useState(defaultFocusTime);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [customTaskName, setCustomTaskName] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTechniqueId, setCurrentTechniqueId] = useState(techniqueId);

  // New states for enhanced features
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [showTaskCompleteDialog, setShowTaskCompleteDialog] = useState(false);
  const [showChangeTaskDialog, setShowChangeTaskDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // State to track tasks in current session
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([]);
  // State to track total session duration for proper calculation
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  // Track if all tasks are already completed
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/bell.mp3");

    // Check for saved timer state
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (!state.isActive && audioRef.current) {
          audioRef.current.pause();
        }
      } catch (error) {
        console.error("Error parsing saved timer state:", error);
      }
    }

    setTimeout(() => {
      setInitializing(false);
    }, 500);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle auto-start from TaskManager
  useEffect(() => {
    // Separate effect specifically for auto-start, with minimal dependencies
    const handleAutoStart = async () => {
      const savedTask = localStorage.getItem('selectedTask');
      const autoStart = localStorage.getItem('autoStartSession');

      if (savedTask && autoStart === 'true') {
        try {
          const task = JSON.parse(savedTask) as Task;
          console.log("Auto-start detected with task:", task.name);

          // Set task info first
          setSelectedTaskId(task.id);
          setCurrentTask(task);
          setCustomTaskName(task.name || "");

          // Wait a bit longer for state to update properly
          setTimeout(async () => {
            try {
              console.log("Auto-starting session for task:", task.name);
              setLoading(true);

              // Get current user
              const { data: { user } } = await supabase.auth.getUser();

              if (!user) {
                throw new Error("Usuario no autenticado");
              }

              // First update the task status to in_progress
              const { data: updatedTask, error: taskUpdateError } = await supabase
                .from("tasks")
                .update({
                  status: "in_progress",
                  updated_at: new Date().toISOString()
                })
                .eq("id", task.id)
                .select()
                .single();

              if (taskUpdateError) throw taskUpdateError;

              // Update current task with the updated status
              if (updatedTask) {
                setCurrentTask(updatedTask);
              }

              // Create a new focus session in Supabase directly
              const now = new Date();
              const { data, error } = await supabase
                .from("focus_sessions")
                .insert({
                  user_id: user.id,
                  task_id: task.id, // Initial task
                  start_time: now.toISOString(),
                  is_completed: false,
                  technique_id: currentTechniqueId
                })
                .select()
                .single();

              if (error) throw error;

              // Update state with session info
              setCurrentSessionId(data.id);
              setStartTime(now);
              setSessionStartTime(now); // Set overall session start time
              setIsActive(true);
              setShowBreakPrompt(false);
              
              // Add first task to session tasks
              setSessionTasks([{
                taskId: task.id,
                name: task.name,
                startTime: now,
                completed: false
              }]);

              // If the component has a callback for task status changes, call it
              if (onTaskStatusChange) {
                onTaskStatusChange();
              }

              toast.success("¡Sesión de enfoque iniciada automáticamente!");
            } catch (err) {
              console.error("Error auto-starting timer:", err);
              toast.error("Error al iniciar la sesión automáticamente");
            } finally {
              // Clean up localStorage after attempt
              localStorage.removeItem('selectedTask');
              localStorage.removeItem('autoStartSession');
              setLoading(false);
            }
          }, 800); // Longer delay for more reliable state updates
        } catch (error) {
          console.error("Error parsing saved task:", error);
          localStorage.removeItem('selectedTask');
          localStorage.removeItem('autoStartSession');
        }
      } else {
        // Regular task handling without auto-start
        if (savedTask && !isActive && !currentSessionId) {
          try {
            const task = JSON.parse(savedTask) as Task;
            setSelectedTaskId(task.id);
            setCurrentTask(task);
            setCustomTaskName(task.name || "");
            localStorage.removeItem('selectedTask'); // Clear it after use
          } catch (error) {
            console.error("Error parsing saved task:", error);
          }
        }
      }
    };

    handleAutoStart();
  }, []); // Run once on mount with empty dependency array

  // Load timer state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);

        // Check if the saved state is still valid
        const savedTime = state.startTime ? new Date(state.startTime) : null;
        const now = new Date();

        // If no startTime or if the session has expired naturally, don't restore
        if (!savedTime || !state.isActive) {
          // Clear invalid state
          localStorage.removeItem('timerState');
          return;
        }

        // Calculate if the timer should have naturally ended
        const elapsedMinutes = savedTime ? Math.floor((now.getTime() - savedTime.getTime()) / 60000) : 0;
        const totalMinutes = state.isBreak ? defaultBreakLength : defaultFocusTime;

        if (elapsedMinutes >= totalMinutes) {
          // Timer would have ended naturally, don't restore
          localStorage.removeItem('timerState');
          return;
        }

        // Calculate the remaining time
        const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes - 1);
        const remainingSeconds = Math.max(0, 59 - Math.floor((now.getTime() - savedTime.getTime()) / 1000) % 60);

        // Restore valid state with adjusted time
        setMinutes(remainingMinutes);
        setSeconds(remainingSeconds);
        setIsActive(state.isActive);
        setIsBreak(state.isBreak);
        setSessionCount(state.sessionCount);
        setSelectedTaskId(state.selectedTaskId);
        setCustomTaskName(state.customTaskName);
        setCurrentSessionId(state.currentSessionId);
        setCurrentTechniqueId(state.currentTechniqueId || techniqueId);
        setShowBreakPrompt(state.showBreakPrompt || false);
        
        // Convert sessionTasks dates from strings to Date objects
        if (state.sessionTasks && Array.isArray(state.sessionTasks)) {
          const restoredTasks = state.sessionTasks.map((task: any) => ({
            ...task,
            startTime: new Date(task.startTime),
            endTime: task.endTime ? new Date(task.endTime) : undefined
          }));
          setSessionTasks(restoredTasks);
        }
        
        if (state.sessionStartTime) {
          setSessionStartTime(new Date(state.sessionStartTime));
        }
        
        if (state.currentTask) {
          setCurrentTask(state.currentTask);
        }
        if (state.startTime) {
          setStartTime(new Date(state.startTime));
        }
        
        // Also restore the allTasksCompleted state if it exists
        if (state.allTasksCompleted !== undefined) {
          setAllTasksCompleted(state.allTasksCompleted);
        }
      } catch (error) {
        console.error("Error restoring timer state:", error);
        localStorage.removeItem('timerState');
      }
    }
  }, [defaultBreakLength, defaultFocusTime, techniqueId]);

  // Find selected task when task ID changes
  useEffect(() => {
    if (selectedTaskId) {
      const task = recentTasks.find(t => t.id === selectedTaskId);
      if (task) {
        setCurrentTask(task);
      }
    } else if (!selectedTaskId && customTaskName.trim() === "") {
      setCurrentTask(null);
    }
  }, [selectedTaskId, recentTasks, customTaskName]);

  // Update techniqueId when it changes from props
  useEffect(() => {
    setCurrentTechniqueId(techniqueId);
  }, [techniqueId]);

  // handle timer state persistence
  useEffect(() => {
    // Save timer state whenever it changes
    const saveTimerState = () => {
      if (isActive || showBreakPrompt) {
        localStorage.setItem('timerState', JSON.stringify({
          minutes,
          seconds,
          isActive,
          isBreak,
          sessionCount,
          selectedTaskId,
          customTaskName,
          currentSessionId,
          currentTechniqueId,
          showBreakPrompt,
          currentTask,
          startTime: startTime ? startTime.toISOString() : null,
          sessionTasks,
          sessionStartTime: sessionStartTime ? sessionStartTime.toISOString() : null,
          allTasksCompleted
        }));
      }
    };

    saveTimerState();
  }, [
    minutes,
    seconds,
    isActive,
    isBreak,
    sessionCount,
    selectedTaskId,
    customTaskName,
    currentSessionId,
    currentTechniqueId,
    startTime,
    showBreakPrompt,
    currentTask,
    sessionTasks,
    sessionStartTime,
    allTasksCompleted
  ]);

  // Check if all tasks are completed
  useEffect(() => {
    if (sessionTasks.length > 0) {
      const allCompleted = sessionTasks.every(task => task.completed);
      setAllTasksCompleted(allCompleted);
    } else {
      setAllTasksCompleted(false);
    }
  }, [sessionTasks]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);

            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.error("Error playing sound:", e));
            }

            // Timer completed - handle session completion or break
            if (isBreak) {
              // Break finished
              setIsActive(false);
              setIsBreak(false);
              setMinutes(defaultFocusTime);
              setSeconds(0);
              
              // Only show task complete dialog if we have tasks that aren't all completed
              if (sessionTasks.length > 0 && !allTasksCompleted) {
                setShowTaskCompleteDialog(true);
              } else {
                toast.success("¡Descanso completado! Listo para comenzar una nueva sesión.");
              }
            } else {
              // Focus session finished
              setIsActive(false);
              handleSessionComplete();

              // Set up for break but don't start it automatically
              setShowBreakPrompt(true);
              toast.success("¡Sesión de enfoque completada! Toma un descanso cuando estés listo.");
            }
            return;
          }
          setMinutes(minutes => minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds => seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval!);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, isBreak, defaultFocusTime, defaultBreakLength, defaultTargetSessions, sessionCount, allTasksCompleted, sessionTasks.length]);


  const startTimer = async () => {
    try {
      // If showing break prompt, don't start a new session
      if (showBreakPrompt) {
        return;
      }

      // If on a break, just start the timer without creating a session
      if (isBreak) {
        setIsActive(true);
        return;
      }

      // Check if we need to select a task first
      if (!selectedTaskId && !customTaskName.trim()) {
        toast.error("Por favor, ingresa o selecciona una tarea");
        return;
      }

      // Clear the auto-start flag if it exists
      localStorage.removeItem('autoStartSession');

      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      let taskId = selectedTaskId;

      // If using a custom task name, create a new task first
      if (!selectedTaskId && customTaskName.trim()) {
        const { data: newTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            name: customTaskName.trim(),
            status: "in_progress", // Set status to in_progress directly for new tasks
            deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (taskError) throw taskError;

        taskId = newTask.id;
        setCurrentTask(newTask);
      } else if (selectedTaskId) {
        // If we have a selected existing task, update its status to in_progress
        const { data, error: updateError } = await supabase
          .from("tasks")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedTaskId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update the current task state to reflect the change
        if (currentTask) {
          setCurrentTask({
            ...currentTask,
            status: "in_progress"
          });
        } else if (data) {
          // If we don't have a current task yet but got data back
          setCurrentTask(data);
        }
      }

      // Create a new focus session in Supabase
      const now = new Date();
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: user.id,
          task_id: taskId, // Initial task - we'll track multiple tasks ourselves
          start_time: now.toISOString(),
          is_completed: false,
          technique_id: currentTechniqueId // Store the technique ID with the session
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setStartTime(now);
      setSessionStartTime(now); // Set overall session start time
      setIsActive(true);
      setShowBreakPrompt(false);
      
      // Initialize session tasks with the first task
      if (taskId) {
        setSessionTasks([{
          taskId,
          name: customTaskName.trim() || currentTask?.name || "Sin nombre",
          startTime: now,
          completed: false
        }]);
      }

      // If we have a callback for task status changes, call it
      if (onTaskStatusChange) {
        onTaskStatusChange();
      }

      toast.success("¡Sesión de enfoque iniciada!");
    } catch (error) {
      console.error("Error al iniciar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al iniciar la sesión");
    } finally {
      setLoading(false);
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
    toast.info(isBreak ? "Descanso pausado" : "Sesión de enfoque pausada");
  };

  const cleanupTimerState = () => {
    localStorage.removeItem('timerState');
    setCurrentSessionId(null);
    setStartTime(null);
    setSessionStartTime(null);
    setShowBreakPrompt(false);
    setSessionTasks([]);
    setAllTasksCompleted(false);
  };

  // Start the break session
  const startBreak = () => {
    setIsBreak(true);
    setMinutes(defaultBreakLength);
    setSeconds(0);
    setSessionCount(prevCount => prevCount + 1);
    setIsActive(true);
    setShowBreakPrompt(false);
    toast.success("¡Comenzando descanso!");
  };

  // Skip the break
  const skipBreak = () => {
    // Important: Keep the task intact for the dialog
    setIsBreak(false);
    setMinutes(defaultFocusTime);
    setSeconds(0);
    setShowBreakPrompt(false);
    
    // Increment session count when skipping break
    setSessionCount(prevCount => prevCount + 1);

    // Only show task complete dialog if we have tasks that aren't all completed
    if (sessionTasks.length > 0 && !allTasksCompleted) {
      setShowTaskCompleteDialog(true);
    } else {
      toast.success("¡Descanso omitido! Listo para comenzar una nueva sesión.");
    }
  };

  // Check if a specific task is already active in the current session
  const isTaskInActiveSession = (taskId: string) => {
    // Only check if THIS specific task is already active (without an end time)
    return sessionTasks.some(task => 
      task.taskId === taskId && !task.endTime
    );
  };

  // Handle task selection during an active session
  const handleTaskChange = () => {
    // If there's a current active task, finalize its time
    if (isActive && currentTask && selectedTaskId) {
      const now = new Date();
      
      // Find the current task in the session tasks array
      const updatedTasks = [...sessionTasks];
      const currentTaskIndex = updatedTasks.findIndex(t => t.taskId === selectedTaskId && !t.endTime);
      
      if (currentTaskIndex >= 0) {
        // Calculate duration in minutes, ensuring at least 1 minute
        const startTime = updatedTasks[currentTaskIndex].startTime;
        const durationMs = now.getTime() - startTime.getTime();
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
        
        // Update the end time for the current task
        updatedTasks[currentTaskIndex] = {
          ...updatedTasks[currentTaskIndex],
          endTime: now,
          durationMinutes: durationMinutes
        };
        
        setSessionTasks(updatedTasks);
      }
    }
    
    // Open the dialog to select a new task
    setShowChangeTaskDialog(true);
  };

  // Apply new task selection during an active session
  const applyTaskChange = async () => {
    try {
      setLoading(true);
      
      // If there's no task selected, return
      if (!selectedTaskId && !customTaskName.trim()) {
        toast.error("Por favor, selecciona o ingresa una tarea");
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      let taskId = selectedTaskId;
      let taskName = currentTask?.name || "";
      
      // Check if the task is already active in the current session
      if (selectedTaskId && isTaskInActiveSession(selectedTaskId)) {
        toast.info(`Ya estás trabajando en esta tarea actualmente`);
        setShowChangeTaskDialog(false);
        return;
      }
      
      // If using custom task name, create a new task
      if (!selectedTaskId && customTaskName.trim()) {
        const { data: newTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            name: customTaskName.trim(),
            status: "in_progress",
            deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (taskError) throw taskError;

        taskId = newTask.id;
        taskName = newTask.name;
        setCurrentTask(newTask);
        setSelectedTaskId(newTask.id);
      } else if (selectedTaskId) {
        // Update the selected task's status to in_progress
        const { data, error: updateError } = await supabase
          .from("tasks")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedTaskId)
          .select()
          .single();

        if (updateError) throw updateError;
        
        if (data) {
          setCurrentTask(data);
          taskName = data.name;
        }
      }
      
      // Create a new entry for the task
      const now = new Date();
      const newSessionTask: SessionTask = {
        taskId: taskId!,
        name: taskName,
        startTime: now,
        completed: false
      };
      
      // Add it to the array
      setSessionTasks([...sessionTasks, newSessionTask]);
      toast.success(`Trabajando ahora en: ${taskName}`);
      
      setShowChangeTaskDialog(false);
      
      // Notify parent component about task status change
      if (onTaskStatusChange) {
        onTaskStatusChange();
      }
    } catch (error) {
      console.error("Error al cambiar de tarea:", error);
      toast.error("Error al cambiar de tarea");
    } finally {
      setLoading(false);
    }
  };

  // State to track task completion options
  const [taskCompletionStates, setTaskCompletionStates] = useState<{[key: string]: boolean}>({});
  const [taskDialogStep, setTaskDialogStep] = useState<'selection' | 'confirmation'>('selection');
  
  // Prepare task completion dialog
  const prepareTaskCompletionDialog = () => {
    // Only consider tasks that have actually been worked on in this session
    const taskIdsInSession = sessionTasks
      .filter(task => !task.completed)  // Only include incomplete tasks
      .map(task => task.taskId);
    
    // If there are no incomplete tasks, don't show the dialog
    if (taskIdsInSession.length === 0) {
      setAllTasksCompleted(true);
      
      // Reset task selection and show success message
      setSelectedTaskId(null);
      setCustomTaskName("");
      setCurrentTask(null);
      
      toast.success("Todas las tareas ya están completadas");
      
      // If we've completed all sessions, reset the counter
      if (sessionCount >= defaultTargetSessions) {
        setSessionCount(0);
        toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
      }
      
      return;
    }
    
    // Create a new object with task IDs as keys and pre-check if it's a single task
    const initialStates: {[key: string]: boolean} = {};
    const defaultChecked = taskIdsInSession.length === 1;
    
    // Add each task ID with its default checked state
    taskIdsInSession.forEach(taskId => {
      initialStates[taskId] = defaultChecked;
    });
    
    console.log("Session tasks:", sessionTasks);
    console.log("Task IDs in session:", taskIdsInSession);
    console.log("Initial completion states:", initialStates);
    
    // If we still somehow have no tasks to show, don't display the dialog
    if (Object.keys(initialStates).length === 0) {
      toast.info("No hay tareas pendientes para completar");
      return;
    }
    
    // Set the states and show the dialog
    setTaskCompletionStates(initialStates);
    setShowTaskCompleteDialog(true);
  };
  
  // Handle task checkbox changes
  const handleTaskCheckboxChange = (taskId: string, checked: boolean) => {
    setTaskCompletionStates(prev => ({
      ...prev,
      [taskId]: checked
    }));
  };
  
  // Process selected task completions
  const processTaskCompletions = async () => {
    try {
      setLoading(true);
      
      // Process each selected task for completion
      const taskIds = Object.keys(taskCompletionStates);
      let completedCount = 0;
      
      for (const taskId of taskIds) {
        // Skip tasks that weren't selected for completion
        if (!taskCompletionStates[taskId]) continue;
        
        // Get task info
        const taskInfo = sessionTasks.find(t => t.taskId === taskId);
        if (!taskInfo) continue;
        
        // Calculate total duration for this task from all focus sessions
        const { data: taskSessions, error: sessionsError } = await supabase
          .from("focus_sessions")
          .select("duration_minutes")
          .eq("task_id", taskId)
          .eq("is_completed", true);

        if (sessionsError) throw sessionsError;

        // Sum up all session durations
        const totalDuration = taskSessions?.reduce((sum, session) =>
          sum + (session.duration_minutes || 0), 0) || 0;

        // Update the task status to completed in the database with duration
        const { error } = await supabase
          .from("tasks")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_minutes: Math.max(1, totalDuration) // Ensure at least 1 minute
          })
          .eq("id", taskId);

        if (error) throw error;
        
        completedCount++;
      }
      
      // Mark the tasks as completed in our session tasks
      const updatedTasks = sessionTasks.map(task => 
        taskCompletionStates[task.taskId] 
          ? { 
              ...task, 
              completed: true, 
              endTime: task.endTime || new Date(),
              // Ensure durationMinutes is at least 1
              durationMinutes: task.durationMinutes 
                ? Math.max(1, task.durationMinutes) 
                : Math.max(1, Math.round((new Date().getTime() - task.startTime.getTime()) / 60000))
            } 
          : task
      );
      setSessionTasks(updatedTasks);

      if (completedCount > 0) {
        toast.success(`${completedCount} ${completedCount === 1 ? 'tarea completada' : 'tareas completadas'}`);
      }

      // Check if all tasks are now completed
      const allComplete = updatedTasks.every(task => task.completed);
      setAllTasksCompleted(allComplete);

      // Notify parent component
      if (onTaskStatusChange) {
        onTaskStatusChange();
      }
      
      // Reset task selection
      setSelectedTaskId(null);
      setCustomTaskName("");
      setCurrentTask(null);
      
      // If we've completed all sessions, reset the counter
      if (sessionCount >= defaultTargetSessions) {
        setSessionCount(0);
        toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
      }
      
    } catch (error) {
      console.error("Error al completar las tareas:", error);
      toast.error("Error al marcar las tareas como completadas");
    } finally {
      setLoading(false);
      // Close the dialog
      setShowTaskCompleteDialog(false);
    }
  };
  
  // Handle task complete dialog response
  const handleTaskComplete = async (proceed: boolean) => {
    if (!proceed) {
      // User canceled, close the dialog
      setShowTaskCompleteDialog(false);
      
      // Now we can clean up the timer state
      cleanupTimerState();
      
      // Reset task selection
      setSelectedTaskId(null);
      setCustomTaskName("");
      setCurrentTask(null);
      
      // If we've completed all sessions, reset the counter
      if (sessionCount >= defaultTargetSessions) {
        setSessionCount(0);
        toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
      }
      return;
    }
    
    // User confirmed, process the task completions directly
    await processTaskCompletions();
    
    // Clean up timer state after processing
    cleanupTimerState();
  };

  // Function to finish session early
  const finishEarly = async () => {
    if (!currentSessionId || isBreak) return;

    try {
      setLoading(true);

      // Calculate the time spent so far
      const startTimeObj = sessionStartTime ? new Date(sessionStartTime) : null;
      if (!startTimeObj) {
        throw new Error("No start time recorded");
      }

      const now = new Date();
      // Calculate minutes elapsed for the entire session
      const minutesElapsed = Math.floor((now.getTime() - startTimeObj.getTime()) / 60000);

      // Only record if at least 1 minute has elapsed
      if (minutesElapsed < 1) {
        toast.error("La sesión debe durar al menos 1 minuto para ser registrada");
        return;
      }

      // Finalize the current task if there is one
      if (currentTask && selectedTaskId) {
        // Find the current task in the session tasks array
        const updatedTasks = [...sessionTasks];
        const currentTaskIndex = updatedTasks.findIndex(t => t.taskId === selectedTaskId && !t.endTime);
        
        if (currentTaskIndex >= 0) {
          // Calculate duration in minutes, ensuring at least 1 minute
          const startTime = updatedTasks[currentTaskIndex].startTime;
          const durationMs = now.getTime() - startTime.getTime();
          const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
          
          // Update the end time for the current task
          updatedTasks[currentTaskIndex] = {
            ...updatedTasks[currentTaskIndex],
            endTime: now,
            durationMinutes: durationMinutes
          };
          
          setSessionTasks(updatedTasks);
        }
      }

      // Make sure all tasks have end times
      const finalizedTasks = sessionTasks.map(task => {
        if (!task.endTime) {
          const duration = Math.max(1, Math.round((now.getTime() - task.startTime.getTime()) / 60000));
          return {
            ...task,
            endTime: now,
            durationMinutes: duration
          };
        }
        return task;
      });
      
      setSessionTasks(finalizedTasks);

      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: now.toISOString(),
          duration_minutes: Math.max(1, minutesElapsed), // Ensure at least 1 minute
          is_completed: true,
          // Store session tasks as JSON data
          notes: JSON.stringify({
            tasks: finalizedTasks.map(task => ({
              taskId: task.taskId,
              name: task.name,
              startTime: task.startTime.toISOString(),
              endTime: task.endTime ? task.endTime.toISOString() : now.toISOString(),
              durationMinutes: task.durationMinutes 
                ? Math.max(1, task.durationMinutes)
                : Math.max(1, Math.round((task.endTime ? task.endTime.getTime() : now.getTime()) - task.startTime.getTime()) / 60000),
              completed: task.completed
            }))
          })
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Update user's total_focus_time using RPC
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: Math.max(1, minutesElapsed),
      });

      // If there are tasks in this session, update their durations
      for (const task of finalizedTasks) {
        // Ensure all tasks have end times
        const taskEndTime = task.endTime || now;
        
        // Calculate task duration, ensuring at least 1 minute
        const taskDurationMinutes = Math.max(1, Math.round(
          (taskEndTime.getTime() - task.startTime.getTime()) / 60000
        ));
        
        // Get task's current duration
        const { data: taskData, error: taskFetchError } = await supabase
          .from("tasks")
          .select("duration_minutes")
          .eq("id", task.taskId)
          .single();

        if (!taskFetchError && taskData) {
          // Add current session duration to existing duration
          const newDuration = (taskData.duration_minutes || 0) + taskDurationMinutes;

          // Update the task's duration
          await supabase
            .from("tasks")
            .update({
              duration_minutes: newDuration,
              updated_at: now.toISOString()
            })
            .eq("id", task.taskId);
        }
      }

      // Reset timer state
      setIsActive(false);
      setMinutes(defaultFocusTime);
      setSeconds(0);
      
      // Don't clean up state until after we're done with showing task completion
      
      // Increment session count when finished early
      setSessionCount(prevCount => prevCount + 1);

      // Only show task completion dialog if we have tasks that aren't all completed
      // and if we have at least one task in the session
      if (finalizedTasks.length > 0 && !allTasksCompleted) {
        prepareTaskCompletionDialog();
      } else {
        cleanupTimerState(); // Clean up only if we're not showing the dialog
        toast.success(`¡Sesión completada! Has registrado ${minutesElapsed} minutos de enfoque.`);
        
        // Reset task selection since we don't need the dialog
        setSelectedTaskId(null);
        setCustomTaskName("");
        setCurrentTask(null);
        
        // If we've completed all sessions, reset the counter
        if (sessionCount >= defaultTargetSessions) {
          setSessionCount(0);
          toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
        }
      }

      // Call callback if provided
      if (onSessionComplete) {
        onSessionComplete();
      }

    } catch (error) {
      console.error("Error al finalizar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al finalizar la sesión");
      cleanupTimerState(); // Make sure we clean up state even if there's an error
    } finally {
      setLoading(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(isBreak ? defaultBreakLength : defaultFocusTime);
    setSeconds(0);
    cleanupTimerState();
    toast.info("Temporizador reiniciado");
  };

  const handleSessionComplete = async () => {
    if (!currentSessionId) return;

    try {
      const endTime = new Date();
      
      // Calculate session duration, ensuring at least 1 minute
      const durationInMinutes = sessionStartTime
        ? Math.max(1, Math.round((endTime.getTime() - sessionStartTime.getTime()) / 60000))
        : defaultFocusTime;

      // Finalize all tasks without endTime
      const updatedTasks = sessionTasks.map(task => {
        if (!task.endTime) {
          // Calculate task duration, ensuring at least 1 minute
          const taskDuration = Math.max(1, Math.round(
            (endTime.getTime() - task.startTime.getTime()) / 60000
          ));
          
          return {
            ...task,
            endTime,
            durationMinutes: taskDuration
          };
        }
        return task;
      });
      
      setSessionTasks(updatedTasks);

      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationInMinutes,
          is_completed: true,
          notes: JSON.stringify({
            tasks: updatedTasks.map(task => ({
              taskId: task.taskId,
              name: task.name,
              startTime: task.startTime.toISOString(),
              endTime: (task.endTime || endTime).toISOString(),
              durationMinutes: task.durationMinutes 
                ? task.durationMinutes 
                : Math.max(1, Math.round((task.endTime ? task.endTime.getTime() : endTime.getTime()) - task.startTime.getTime()) / 60000),
              completed: task.completed
            }))
          })
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Update user's total_focus_time using RPC
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: durationInMinutes,
      });

      // Update durations for each task in the session
      for (const task of updatedTasks) {
        const taskEndTime = task.endTime || endTime;
        
        // Calculate task duration, ensuring at least 1 minute
        const taskDurationMinutes = Math.max(1, Math.round(
          (taskEndTime.getTime() - task.startTime.getTime()) / 60000
        ));
        
        // Get task's current duration
        const { data: taskData, error: taskFetchError } = await supabase
          .from("tasks")
          .select("duration_minutes")
          .eq("id", task.taskId)
          .single();

        if (!taskFetchError && taskData) {
          // Add current session duration to existing duration
          const newDuration = (taskData.duration_minutes || 0) + taskDurationMinutes;

          // Update the task's duration
          await supabase
            .from("tasks")
            .update({
              duration_minutes: newDuration,
              updated_at: endTime.toISOString()
            })
            .eq("id", task.taskId);
        }
      }

      setCurrentSessionId(null);
      setStartTime(null);
      setSessionStartTime(null);

      // Call callback if provided
      if (onSessionComplete) {
        onSessionComplete();
      }
    } catch (error) {
      console.error("Error al completar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al completar la sesión");
    }
  };

  // Get the current task display name for the timer
  const getCurrentTaskName = () => {
    if (isBreak) return "Descanso";
    if (!currentTask && !customTaskName.trim()) return "Sesión de Enfoque";
    return currentTask?.name || customTaskName.trim();
  };

  if (initializing) {
    return (
      <Card className="w-full bg-[#1a1a2e] border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-white">
            Cargando Temporizador
          </CardTitle>
          <CardDescription className="text-purple-400">
            Preparando tu entorno de enfoque...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <div className="relative mb-8">
            <Skeleton className="w-64 h-64 rounded-full" />
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: defaultTargetSessions }).map((_, index) => (
                <Skeleton key={index} className="w-3 h-3 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <Skeleton className="w-full h-10 rounded-md mb-4" />
            <Skeleton className="w-full h-10 rounded-md" />
            <div className="mt-6 w-full flex justify-center">
              <Skeleton className="w-80 h-10 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full bg-[#1a1a2e] border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-white">
            {isBreak ? "Descanso" : "Temporizador de Enfoque"}
          </CardTitle>
          <CardDescription className="text-purple-400">
            {isBreak
              ? `Toma un descanso y vuelve en ${defaultBreakLength} minutos`
              : getCurrentTaskName()
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          {/* Timer Display */}
          <div className="relative mb-8">
            <div className="w-64 h-64 rounded-full border-4 border-gray-700 flex items-center justify-center">
              <div className="w-60 h-60 rounded-full border border-purple-500/20 flex items-center justify-center relative">
                {/* Progress circle */}
                <svg className="absolute inset-0" width="240" height="240" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r="112"
                    fill="none"
                    stroke={isBreak ? "#16a34a" : "#9333ea"}
                    strokeWidth="4"
                    strokeDasharray={`${704 * ((isBreak ? defaultBreakLength : defaultFocusTime) * 60 - (minutes * 60 + seconds)) / ((isBreak ? defaultBreakLength : defaultFocusTime) * 60)} 704`}
                    transform="rotate(-90 120 120)"
                  />
                </svg>

                <div className="text-center">
                  <div className="text-5xl font-mono font-bold">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {isBreak ? "Descanso" : "Sesión de Enfoque"}
                  </div>
                  {!isBreak && (
                    <div className="mt-2 text-sm text-purple-400">
                      Sesión {sessionCount + 1} de {defaultTargetSessions}
                    </div>
                  )}
                  {currentTask && (
                    <div className="mt-2 text-sm text-blue-400">
                      {currentTask.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session counters */}
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: defaultTargetSessions }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${index < sessionCount
                    ? 'bg-purple-600'
                    : index === sessionCount && !isBreak
                      ? 'bg-purple-400 animate-pulse'
                      : 'bg-gray-700'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Centered container with max width */}
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            {/* Break Prompt - show when a focus session just ended */}
            {showBreakPrompt && (
              <div className="space-y-4 bg-[#262638] p-4 rounded-lg border border-gray-700 w-full max-w-md">
                <div className="text-center">
                  <h3 className="text-base text-white mb-2">¡Sesión completada!</h3>
                  <p className="text-gray-300 text-xs">Tu sesión de enfoque ha terminado. ¿Qué te gustaría hacer?</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={startBreak}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-xs"
                    disabled={loading}
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Comenzar Descanso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={skipBreak}
                    size="sm"
                    className="border-gray-600 text-xs"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Omitir Descanso
                  </Button>
                </div>
              </div>
            )}

            {/* Task selector with buttons in-line - improved alignment */}
            {!showBreakPrompt && !isActive && !isBreak && (
              <div className="w-full space-y-3">
                <div className="w-full">
                  <CompactTaskSelection
                    recentTasks={recentTasks}
                    selectedTaskId={selectedTaskId}
                    customTaskName={customTaskName}
                    setSelectedTaskId={setSelectedTaskId}
                    setCustomTaskName={setCustomTaskName}
                    setCurrentTask={setCurrentTask}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                    onClick={startTimer}
                    disabled={(!selectedTaskId && !customTaskName.trim()) || loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <span className="text-sm">Comenzar</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTimer}
                    className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white min-w-9 h-9 p-0 flex items-center justify-center flex-shrink-0"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!showBreakPrompt && isActive && (
              <div className="flex flex-col gap-3 w-full">
                {/* First row of buttons */}
                <div className="flex justify-center gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={pauseTimer}
                    className="border-purple-700 text-purple-400 hover:bg-purple-900/20 flex-1 h-9"
                    disabled={loading}
                  >
                    <Pause className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Pausar</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTimer}
                    className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white min-w-9 h-9 p-0 flex items-center justify-center flex-shrink-0"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Second row of buttons - only during focus session */}
                {!isBreak && (
                  <div className="flex justify-center gap-3 w-full">
                    {/* Task complete button */}
                    <Button
                      variant="outline"
                      onClick={() => setShowTaskCompleteDialog(true)}
                      className="border-green-700 text-green-400 hover:bg-green-900/20 flex-1 h-9"
                      disabled={loading || !currentTask || allTasksCompleted}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Completar Tarea</span>
                    </Button>
                    
                    {/* Change task button */}
                    <Button
                      variant="outline"
                      onClick={handleTaskChange}
                      className="border-blue-700 text-blue-400 hover:bg-blue-900/20 flex-1 h-9"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Nueva Tarea</span>
                    </Button>
                  </div>
                )}
                
                {/* Third row - finish early button - only during focus session */}
                {!isBreak && (
                  <Button
                    variant="outline"
                    onClick={finishEarly}
                    className="border-red-700 text-red-400 hover:bg-red-900/20 h-9 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                    ) : (
                      <StopCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <span className="text-sm">Finalizar Sesión</span>
                  </Button>
                )}
              </div>
            )}

            {/* Session Tasks List - Show during active session for reference */}
            {isActive && !isBreak && sessionTasks.length > 0 && (
              <div className="mt-6 w-full">
                <div className="bg-[#262638] p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white flex items-center">
                      <ListChecks className="h-4 w-4 mr-2 text-purple-400" />
                      Tareas de la sesión
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {/* First show active tasks (without endTime) */}
                    {sessionTasks
                      .filter(task => !task.endTime)
                      .map((task, index) => (
                        <div key={`active-${index}`} className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-[#1a1a2e] border-l-2 border-blue-500">
                          <div className="flex items-center">
                            <Play className="h-3.5 w-3.5 mr-2 text-blue-400" />
                            <span className="font-medium text-blue-100">
                              {task.name}
                            </span>
                          </div>
                          <span className="text-gray-400">activa</span>
                        </div>
                      ))
                    }
                    
                    {/* Then show recently ended tasks - last 3 */}
                    {sessionTasks
                      .filter(task => task.endTime)
                      .slice(-3)
                      .map((task, index) => (
                        <div key={`ended-${index}`} className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-[#1a1a2e]">
                          <div className="flex items-center">
                            {task.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-400" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                            )}
                            <span className={task.completed ? "line-through text-gray-400" : ""}>
                              {task.name}
                            </span>
                          </div>
                          {task.durationMinutes && (
                            <span className="text-gray-400">{task.durationMinutes}m</span>
                          )}
                        </div>
                      ))
                    }
                    
                    {/* Show count of additional tasks if there are more than shown */}
                    {sessionTasks.filter(task => task.endTime).length > 3 && (
                      <div className="text-center text-xs text-gray-500">
                        +{sessionTasks.filter(task => task.endTime).length - 3} tareas anteriores
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audio player moved inside the centered container */}
            <div className="mt-6 w-full flex justify-center">
              <AudioPlayer />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTaskCompleteDialog} onOpenChange={setShowTaskCompleteDialog}>
        <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              Completar Tarea{Object.keys(taskCompletionStates).length > 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {Object.keys(taskCompletionStates).length === 1 ? 
                `¿Deseas marcar "${
                  sessionTasks.find(t => t.taskId === Object.keys(taskCompletionStates)[0])?.name || 'esta tarea'
                }" como completada?` : 
                "Selecciona las tareas que has completado durante esta sesión"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Task list section */}
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {/* Check if there are any task IDs in the taskCompletionStates */}
            {Object.keys(taskCompletionStates).length > 0 ? (
              // Map through each task ID and render the task
              Object.keys(taskCompletionStates).map(taskId => {
                // Find the task in the session tasks
                const tasksWithThisId = sessionTasks.filter(t => t.taskId === taskId);
                if (tasksWithThisId.length === 0) return null;
                
                // Get the most recent instance of this task
                const task = tasksWithThisId[tasksWithThisId.length - 1];
                
                // Calculate total minutes for this task across all instances
                const totalMinutes = tasksWithThisId.reduce((total, t) => {
                  const endTime = t.endTime || new Date();
                  const minutes = Math.max(1, Math.round((endTime.getTime() - t.startTime.getTime()) / 60000));
                  return total + minutes;
                }, 0);
                
                return (
                  <div 
                    key={taskId}
                    className="p-3 rounded-md flex items-center justify-between bg-[#262638]"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`task-${taskId}`}
                        checked={taskCompletionStates[taskId] || false}
                        onChange={(e) => handleTaskCheckboxChange(taskId, e.target.checked)}
                        className="h-4 w-4 bg-[#353545] border-gray-700 rounded mr-3 focus:ring-purple-600"
                        disabled={loading}
                      />
                      <div>
                        <label 
                          htmlFor={`task-${taskId}`}
                          className="font-medium text-white"
                        >
                          {task.name}
                        </label>
                        <p className="text-xs text-gray-400">
                          {totalMinutes} minutos de trabajo
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-400">
                No hay tareas en esta sesión
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => handleTaskComplete(false)}
              className="border-gray-700"
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={() => handleTaskComplete(true)}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading || Object.keys(taskCompletionStates).length === 0 || 
                     (Object.keys(taskCompletionStates).length > 0 && 
                      Object.values(taskCompletionStates).every(v => !v))}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {Object.keys(taskCompletionStates).length === 1 ? 
                "Completar Tarea" : 
                "Completar Seleccionadas"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Task Dialog */}
      <Dialog open={showChangeTaskDialog} onOpenChange={setShowChangeTaskDialog}>
        <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Seleccionar Nueva Tarea</DialogTitle>
            <DialogDescription className="text-gray-400">
              Continúa tu sesión de enfoque con una nueva tarea.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <CompactTaskSelection
              recentTasks={recentTasks.filter(t => {
                // Only filter out completed tasks and the specific task that's already active
                return t.status !== "completed" && 
                       // If this specific task is already active, filter it out
                       (selectedTaskId === t.id || !isTaskInActiveSession(t.id));
              })}
              selectedTaskId={selectedTaskId}
              customTaskName={customTaskName}
              setSelectedTaskId={setSelectedTaskId}
              setCustomTaskName={setCustomTaskName}
              setCurrentTask={setCurrentTask}
              disabled={loading}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowChangeTaskDialog(false)}
              className="mr-2"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={applyTaskChange}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Aplicar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}