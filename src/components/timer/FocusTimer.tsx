"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  StopCircle,
  Coffee,
  RotateCcw,
  Loader2,
  SkipForward,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import AudioPlayer from "@/components/audio/AudioPlayer";
import SessionTasksPanel from "./SessionTasksPanel";
import { Skeleton } from "@/components/ui/skeleton";

type FocusTimerProps = {
  defaultFocusTime: number;
  defaultBreakLength: number;
  defaultTargetSessions: number;
  techniqueId?: string;
  onSessionComplete?: () => void;
  onTaskStatusChange?: () => void;
};

export default function FocusTimer({
  defaultFocusTime = 25,
  defaultBreakLength = 5,
  defaultTargetSessions = 4,
  techniqueId = "custom",
  onSessionComplete,
  onTaskStatusChange
}: FocusTimerProps) {
  // Timer state
  const [minutes, setMinutes] = useState(defaultFocusTime);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTechniqueId, setCurrentTechniqueId] = useState(techniqueId);

  // UI state
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Session time tracking
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Audio ref for notifications
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

  // Update techniqueId when it changes from props
  useEffect(() => {
    setCurrentTechniqueId(techniqueId);
  }, [techniqueId]);

  // Handle timer state persistence
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
          currentSessionId,
          currentTechniqueId,
          showBreakPrompt,
          startTime: startTime ? startTime.toISOString() : null,
          sessionStartTime: sessionStartTime ? sessionStartTime.toISOString() : null
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
    currentSessionId,
    currentTechniqueId,
    startTime,
    showBreakPrompt,
    sessionStartTime
  ]);

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
        setCurrentSessionId(state.currentSessionId);
        setCurrentTechniqueId(state.currentTechniqueId || techniqueId);
        setShowBreakPrompt(state.showBreakPrompt || false);

        if (state.sessionStartTime) {
          setSessionStartTime(new Date(state.sessionStartTime));
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
              toast.success("¡Descanso completado! Es hora de comenzar una nueva sesión.");
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

  // Start timer and create a new session
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

      // Clear the auto-start flag if it exists
      localStorage.removeItem('autoStartSession');

      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Create a new focus session in Supabase - no task relationship
      const now = new Date();
      const sessionData = {
        user_id: user.id,
        start_time: now.toISOString(),
        is_completed: false,
        technique_id: currentTechniqueId
      };

      const { data, error } = await supabase
        .from("focus_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setStartTime(now);
      setSessionStartTime(now); // Set overall session start time
      setIsActive(true);
      setShowBreakPrompt(false);

      toast.success("¡Sesión de enfoque iniciada!");
    } catch (error) {
      console.error("Error al iniciar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al iniciar la sesión");
    } finally {
      setLoading(false);
    }
  };

  // Pause the timer
  const pauseTimer = () => {
    setIsActive(false);
    toast.info(isBreak ? "Descanso pausado" : "Sesión de enfoque pausada");
  };

  // Clean up timer state
  const cleanupTimerState = () => {
    localStorage.removeItem('timerState');
    setCurrentSessionId(null);
    setStartTime(null);
    setSessionStartTime(null);
    setShowBreakPrompt(false);
  };

  // Start the break session
  const startBreak = () => {
    setIsBreak(true);
    setMinutes(defaultBreakLength);
    setSeconds(0);
    setIsActive(true);
    setShowBreakPrompt(false);
    toast.success("¡Comenzando descanso!");
  };

  // Skip the break
  const skipBreak = () => {
    setIsBreak(false);
    setMinutes(defaultFocusTime);
    setSeconds(0);
    setShowBreakPrompt(false);
    setIsActive(false); // Ensure timer is stopped and not auto-starting

    // If we've completed all sessions, reset the counter
    if (sessionCount + 1 >= defaultTargetSessions) {
      toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
      setSessionCount(0);
    } else {
      toast.info("Descanso omitido. Listo para comenzar una nueva sesión.");
    }

    // Ensure current session is cleared properly
    setCurrentSessionId(null);
    setStartTime(null);
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
        minutes_to_add: minutesElapsed
      });

      // Reset timer state
      setIsActive(false);
      setMinutes(defaultFocusTime);
      setSeconds(0);
      cleanupTimerState();

      // Increment session count when finished early
      setSessionCount(prevCount => prevCount + 1);

      // Set sessionCompleted flag to true 
      setSessionCompleted(true);

      // Call onSessionComplete
      if (onSessionComplete) {
        onSessionComplete();
      }

      toast.success(`¡Sesión completada! Has registrado ${minutesElapsed} minutos de enfoque.`);

      // If we've completed all sessions, reset the counter
      if (sessionCount + 1 >= defaultTargetSessions) {
        toast.success("¡Felicitaciones! Has completado todas tus sesiones de enfoque.");
        setSessionCount(0);
      }

    } catch (error) {
      console.error("Error al finalizar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al finalizar la sesión");
    } finally {
      setLoading(false);
    }
  };

  // Reset the timer
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(isBreak ? defaultBreakLength : defaultFocusTime);
    setSeconds(0);
    cleanupTimerState();
    toast.info("Temporizador reiniciado");
  };

  // Handle session completion
  const handleSessionComplete = async () => {
    if (!currentSessionId) return;

    try {
      const endTime = new Date();
      const sessionStartTimeObj = sessionStartTime ? new Date(sessionStartTime) : null;
      const durationInMinutes = sessionStartTimeObj
        ? Math.round((endTime.getTime() - sessionStartTimeObj.getTime()) / 60000)
        : defaultFocusTime;

      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationInMinutes,
          is_completed: true
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Update user's total_focus_time using RPC
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: durationInMinutes,
      });

      setSessionCount(prevCount => prevCount + 1);

      setCurrentSessionId(null);
      setStartTime(null);
      setSessionStartTime(null);

      // Set the sessionCompleted flag to true
      setSessionCompleted(true);

      // Call onSessionComplete
      if (onSessionComplete) {
        onSessionComplete();
      }
    } catch (error) {
      console.error("Error al completar la sesión:", error);
      toast.error(error instanceof Error ? error.message : "Error al completar la sesión");
    }
  };

  // Loading state
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
            <div className="mt-6 w-full flex justify-center">
              <Skeleton className="w-80 h-10 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#1a1a2e] border-gray-800">
      <CardHeader className="text-center relative">
        <CardTitle className="text-white">
          {isBreak ? "Descanso" : "Temporizador de Enfoque"}
        </CardTitle>
        <CardDescription className="text-purple-400">
          {isBreak
            ? `Toma un descanso y vuelve en ${defaultBreakLength} minutos`
            : "Mantén tu enfoque y productividad"
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

          {/* Timer controls - Not during break prompt */}
          {!showBreakPrompt && !isActive && (
            <div className="w-full space-y-3">
              <div className="flex gap-3">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 flex-1"
                  onClick={startTimer}
                  disabled={loading}
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

          {/* Active timer controls */}
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

                {/* Skip break button - only shown during breaks */}
                {isBreak && (
                  <Button
                    variant="outline"
                    onClick={skipBreak}
                    className="border-blue-700 text-blue-400 hover:bg-blue-900/20 flex-1 h-9"
                    disabled={loading}
                  >
                    <SkipForward className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">Omitir Descanso</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={resetTimer}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white min-w-9 h-9 p-0 flex items-center justify-center flex-shrink-0"
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Finish early button - only during focus session */}
              {!isBreak && (
                <Button
                  variant="outline"
                  onClick={finishEarly}
                  className="border-red-700 text-red-400 hover:bg-red-900/20 h-9"
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

          {/* Task Management Panel - Added below audio player */}
          {!isBreak && (
            <div className="mt-6 w-full">
              <SessionTasksPanel
                isActiveSession={isActive}
                onTaskStatusChange={onTaskStatusChange}
                isSessionCompleted={sessionCompleted}
              />
            </div>
          )}

          {/* Audio player moved inside the centered container */}
          <div className="mt-6 w-full flex justify-center">
            <AudioPlayer />
          </div>


        </div>
      </CardContent>
    </Card>
  );
}