"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  SkipForward, 
  StopCircle, 
  CheckCircle2, 
  XCircle,
  Coffee,
  RotateCcw
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

type Task = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type FocusTimerProps = {
  defaultFocusTime: number;
  defaultBreakLength: number;
  defaultTargetSessions: number;
  recentTasks: Task[];
  techniqueId?: string;
  onSessionComplete?: () => void;
  onTaskStatusChange?: () => void; 
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
  
  // New states for the new features
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [showTaskCompleteDialog, setShowTaskCompleteDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/bell.mp3");
    
    // Add this check to prevent auto-play when component mounts
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (!state.isActive) {
        // If timer isn't active, make sure audio won't play automatically
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
        if (state.currentTask) {
          setCurrentTask(state.currentTask);
        }
        if (state.startTime) {
          setStartTime(new Date(state.startTime));
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

  // Handle saved task from local storage (for task integration)
  useEffect(() => {
    const savedTask = localStorage.getItem('selectedTask');
    if (savedTask && !isActive && !currentSessionId) {
      try {
        const task = JSON.parse(savedTask);
        setSelectedTaskId(task.id);
        setCurrentTask(task);
        localStorage.removeItem('selectedTask'); // Clear it after use
      } catch (error) {
        console.error("Error parsing saved task:", error);
      }
    }
  }, [isActive, currentSessionId]);

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
          startTime: startTime ? startTime.toISOString() : null
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
    currentTask
  ]);

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
              setShowTaskCompleteDialog(true); // Show task complete dialog after break
              toast.success("¡Descanso completado! Es hora de elegir o continuar tu tarea.");
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
  }, [isActive, minutes, seconds, isBreak, defaultFocusTime, defaultBreakLength, defaultTargetSessions, sessionCount]);


const startTimer = async () => {
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

  try {
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
          status: "pending"
        })
        .select()
        .single();
        
      if (taskError) throw taskError;
      
      taskId = newTask.id;
      setCurrentTask(newTask);
    }

    // Create a new focus session in Supabase
    const now = new Date();
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        task_id: taskId,
        start_time: now.toISOString(),
        is_completed: false,
        technique_id: currentTechniqueId // Store the technique ID with the session
      })
      .select()
      .single();

    if (error) throw error;

    setCurrentSessionId(data.id);
    setStartTime(now);
    setIsActive(true);
    setShowBreakPrompt(false);
    toast.success("¡Sesión de enfoque iniciada!");
  } catch (error) {
    console.error("Error al iniciar la sesión:", error);
    toast.error(error instanceof Error ? error.message : "Error al iniciar la sesión");
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
    setShowBreakPrompt(false);
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
    setSessionCount(prevCount => prevCount + 1);
    
    // Show task complete dialog
    setShowTaskCompleteDialog(true);
  };
  
  // Handle task complete dialog response
  const handleTaskComplete = async (complete: boolean) => {
    if (complete && currentTask) {
      try {
        // Update the task status to completed in the database
        const { error } = await supabase
          .from("tasks")
          .update({ 
            status: "completed",
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq("id", currentTask.id);
        
        if (error) throw error;
        
        toast.success(`Tarea "${currentTask.name}" marcada como completada`);
        
        // Notify parent component
        if (onTaskStatusChange) {
          onTaskStatusChange();
        }
      } catch (error) {
        console.error("Error al completar la tarea:", error);
        toast.error("Error al marcar la tarea como completada");
      }
    }
    
    // Close the dialog
    setShowTaskCompleteDialog(false);
    
    // Reset task selection AFTER handling the dialog response
    setSelectedTaskId(null);
    setCustomTaskName("");
    setCurrentTask(null);
    
    // If we've completed all sessions, reset the counter
    if (sessionCount >= defaultTargetSessions) {
      setSessionCount(0);
      toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
    }
  };
  
  // New function to finish session early
  const finishEarly = async () => {
    if (!currentSessionId || isBreak) return;
    
    try {
      // Calculate the time spent so far
      const startTimeObj = startTime ? new Date(startTime) : null;
      if (!startTimeObj) {
        throw new Error("No start time recorded");
      }
      
      const now = new Date();
      // Calculate minutes elapsed
      const minutesElapsed = Math.floor((now.getTime() - startTimeObj.getTime()) / 60000);
      
      // Only record if at least 1 minute has elapsed
      if (minutesElapsed < 1) {
        toast.error("La sesión debe durar al menos 1 minuto para ser registrada");
        return;
      }
      
      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: now.toISOString(),
          duration_minutes: minutesElapsed,
          is_completed: true
        })
        .eq("id", currentSessionId);

      if (error) throw error;
      
      // Update user's total_focus_time using RPC
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: minutesElapsed,
      });
      
      // Reset timer state
      setIsActive(false);
      setMinutes(defaultFocusTime);
      setSeconds(0);
      cleanupTimerState();
      
      // Show task complete dialog
      setShowTaskCompleteDialog(true);
      
      // Call callback if provided
      if (onSessionComplete) {
        onSessionComplete();
      }
      
      toast.success(`¡Sesión completada! Has registrado ${minutesElapsed} minutos de enfoque.`);
      
    } catch (error) {
      console.error("Error al finalizar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al finalizar la sesión");
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
      const durationInMinutes = startTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
        : defaultFocusTime;

      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationInMinutes,
          is_completed: true,
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Update user's total_focus_time using RPC
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: durationInMinutes,
      });

      setCurrentSessionId(null);
      setStartTime(null);
      
      // Call callback if provided
      if (onSessionComplete) {
        onSessionComplete();
      }
    } catch (error) {
      console.error("Error al completar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al completar la sesión");
    }
  };

  return (
    <>
      <Card className="w-full bg-[#1a1a2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isBreak ? "Descanso" : "Temporizador de Enfoque"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isBreak
              ? `Toma un descanso y vuelve en ${defaultBreakLength} minutos`
              : `${currentTask?.name ? 'Tarea' + currentTask?.name : 'Comienza tu sesión de enfoque para aumentar tu productividad'}`
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

          <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
            {/* Task Selection - Only show when not in active mode and not during break */}
            {!isActive && !isBreak && !showBreakPrompt && (
              <>
                <p className="text-base">Selecciona una tarea</p>
                {recentTasks.length > 0 ? (
                  <Select
                    value={selectedTaskId || undefined}
                    onValueChange={(value) => {
                      if (value === "new-task") {
                        setSelectedTaskId(null);
                        setCustomTaskName("");
                      } else {
                        setSelectedTaskId(value);
                        if (value) setCustomTaskName("");
                      }
                    }}
                  >
                    <SelectTrigger className="bg-[#262638] border-gray-700 text-white">
                      <SelectValue placeholder="¿En qué quieres trabajar?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#262638] border-gray-700 text-white">
                      <SelectItem value="new-task">Nueva tarea...</SelectItem>
                      {recentTasks
                        .filter(task => task.status !== "completed") // Filter out completed tasks
                        .map((task) => (
                          <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {(selectedTaskId === null || !recentTasks.filter(task => task.status !== "completed").length) && (
                  <Input
                    placeholder="¿En qué estás trabajando?"
                    value={customTaskName}
                    onChange={(e) => {
                      setCustomTaskName(e.target.value);
                      setSelectedTaskId(null);
                    }}
                    className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
                  />
                )}
              </>
            )}
            
            {/* Break Prompt - show when a focus session just ended */}
            {showBreakPrompt && (
              <div className="space-y-4 bg-[#262638] p-4 rounded-lg border border-gray-700">
                <div className="text-center">
                  <h3 className="text-base text-white mb-2">¡Sesión completada!</h3>
                  <p className="text-gray-300 text-xs">Tu sesión de enfoque ha terminado. ¿Qué te gustaría hacer?</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={startBreak}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Comenzar Descanso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={skipBreak}
                    size="sm"
                    className="border-gray-600 text-xs"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Omitir Descanso
                  </Button>
                </div>
              </div>
            )}

            {/* Regular Timer controls - don't show during break prompt */}
            {!showBreakPrompt && (
              <div className="flex space-x-2">
                {!isActive ? (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={startTimer}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isBreak ? "Continuar Descanso" : "Comenzar"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={pauseTimer}
                    className="flex-1 border-purple-700 text-purple-400 hover:bg-purple-900/20"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={resetTimer}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Reiniciar</span>
                </Button>
              </div>
            )}
            
            {/* Finish early button - only show during active focus session */}
            {isActive && !isBreak && (
              <Button
                variant="outline"
                onClick={finishEarly}
                className="border-green-700 text-green-400 hover:bg-green-900/20 mt-2"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Finalizar ahora
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Task Complete Dialog */}
      <Dialog open={showTaskCompleteDialog} onOpenChange={setShowTaskCompleteDialog}>
        <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>¿Completar la tarea?</DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentTask ? (
                `¿Has completado la tarea "${currentTask.name}"?`
              ) : (
                "¿Deseas seleccionar una nueva tarea para la siguiente sesión?"
              )}
            </DialogDescription>
          </DialogHeader>
          
          {currentTask && (
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={() => handleTaskComplete(true)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sí, completada
              </Button>
              <Button 
                onClick={() => handleTaskComplete(false)}
                variant="outline"
                className="flex-1 border-gray-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                No, continuar
              </Button>
            </div>
          )}
          
          {!currentTask && (
            <DialogFooter>
              <Button onClick={() => handleTaskComplete(false)}>
                Seleccionar nueva tarea
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}