"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipForward } from "lucide-react";
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
};

export default function FocusTimer({
  defaultFocusTime = 25,
  defaultBreakLength = 5,
  defaultTargetSessions = 4,
  recentTasks = []
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/bell.mp3");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // handle timer state persistence
  useEffect(() => {
    // Save timer state whenever it changes
    const saveTimerState = () => {
      if (isActive) {
        localStorage.setItem('timerState', JSON.stringify({
          minutes,
          seconds,
          isActive,
          isBreak,
          sessionCount,
          selectedTaskId,
          customTaskName,
          currentSessionId,
          startTime: startTime ? startTime.toISOString() : null
        }));
      }
    };

    saveTimerState();
  }, [minutes, seconds, isActive, isBreak, sessionCount, selectedTaskId, customTaskName, currentSessionId, startTime]);

  // Load timer state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setMinutes(state.minutes);
        setSeconds(state.seconds);
        setIsActive(state.isActive);
        setIsBreak(state.isBreak);
        setSessionCount(state.sessionCount);
        setSelectedTaskId(state.selectedTaskId);
        setCustomTaskName(state.customTaskName);
        setCurrentSessionId(state.currentSessionId);
        if (state.startTime) {
          setStartTime(new Date(state.startTime));
        }
      } catch (error) {
        console.error("Error restoring timer state:", error);
      }
    }
  }, []);


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
              // Break finished, start focus session
              setIsBreak(false);
              setMinutes(defaultFocusTime);
              setSeconds(0);
              setIsActive(false);
              toast.success("¡Descanso completado! Listo para concentrarte de nuevo.");
            } else {
              // Focus session finished
              handleSessionComplete();

              // Move to break or finish
              if (sessionCount + 1 >= defaultTargetSessions) {
                // All sessions completed
                setIsActive(false);
                setSessionCount(0);
                toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
              } else {
                // Start break
                setIsBreak(true);
                setMinutes(defaultBreakLength);
                setSeconds(0);
                setSessionCount(prevCount => prevCount + 1);
                setIsActive(true);
                toast.success("¡Sesión de enfoque completada! Toma un descanso.");
              }
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
  // If on a break, just start the timer without creating a session
  if (isBreak) {
    setIsActive(true);
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
      // You might want to update the recentTasks list here if you want immediate UI feedback
    } else if (!selectedTaskId && !customTaskName.trim()) {
      toast.error("Por favor, ingresa o selecciona una tarea");
      return;
    }

    // Create a new focus session in Supabase
    const now = new Date();
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        task_id: taskId,
        start_time: now.toISOString(),
        is_completed: false
      })
      .select()
      .single();

    if (error) throw error;

    setCurrentSessionId(data.id);
    setStartTime(now);
    setIsActive(true);
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
      cleanupTimerState(); 
    } catch (error) {
      console.error("Error al completar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al completar la sesión");
    }
  };

  return (
    <Card className="w-full bg-[#1a1a2e] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">
          {isBreak ? "Descanso" : "Temporizador de Enfoque"}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {isBreak
            ? `Toma un descanso y vuelve en ${defaultBreakLength} minutos`
            : "Comienza tu sesión de enfoque para aumentar tu productividad"
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
                  // The key fix is in this calculation:
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
          <p className="text-base">Selecciona una tarea</p>
          {!isActive && !isBreak && (
  <>
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

          {/* Timer controls */}
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
              <SkipForward className="h-4 w-4" />
              <span className="sr-only">Reiniciar</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}