"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Play, Pause, SkipForward, Clock } from "lucide-react";

export default function TimerPage() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);
            setIsActive(false);
            handleSessionComplete();
            toast.success("Focus session completed!");
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
  }, [isActive, minutes, seconds]);

  const startTimer = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    try {
      // Create a new focus session in Supabase
      const now = new Date();
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          task_name: sessionName,
          start_time: now.toISOString(),
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setStartTime(now);
      setIsActive(true);
      toast.success("Focus session started!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start session");
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
    toast.info("Focus session paused");
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    toast.info("Timer reset");
  };

  const handleSessionComplete = async () => {
    if (!currentSessionId) return;

    try {
      const endTime = new Date();
      const durationInMinutes = startTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) 
        : 25;

      // Update the session in Supabase
      const { error } = await supabase
        .from("focus_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration: durationInMinutes,
          is_completed: true,
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Update user's total_focus_time
      await supabase.rpc("increment_focus_time", {
        minutes_to_add: durationInMinutes,
      });

      setCurrentSessionId(null);
      setStartTime(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete session");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Focus Timer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="w-full bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Timer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-7xl font-bold mb-8 text-purple-400 font-mono">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              <Input 
                placeholder="What are you working on?" 
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={isActive}
                className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
              />
              
              <div className="flex space-x-2">
                {!isActive ? (
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={startTimer}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={pauseTimer}
                    className="flex-1 border-purple-700 text-purple-400 hover:bg-purple-900/20"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={resetTimer}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <SkipForward className="h-4 w-4" />
                  <span className="sr-only">Reset</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Timer Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="focusLength" className="text-sm font-medium text-gray-300">
                  Focus Duration (minutes)
                </label>
                <div className="flex space-x-2">
                  {[25, 30, 45, 60].map((value) => (
                    <Button
                      key={value}
                      variant={minutes === value ? "default" : "outline"}
                      onClick={() => {
                        if (!isActive) {
                          setMinutes(value);
                          setSeconds(0);
                        }
                      }}
                      disabled={isActive}
                      className={`flex-1 ${
                        minutes === value 
                          ? "bg-purple-600 hover:bg-purple-700" 
                          : "border-gray-700 text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label htmlFor="customFocusLength" className="text-sm font-medium text-gray-300">
                  Custom Duration
                </label>
                <Input
                  id="customFocusLength"
                  type="number"
                  min="1"
                  max="120"
                  value={minutes}
                  onChange={(e) => !isActive && setMinutes(parseInt(e.target.value) || 25)}
                  disabled={isActive}
                  className="bg-[#262638] border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-400">
              <Clock className="h-4 w-4 inline-block mr-1" />
              Based on the Pomodoro Technique
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="w-full bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Focus Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                <span>Work in 25-minute sessions with 5-minute breaks for optimal focus.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                <span>Remove distractions by closing unnecessary tabs and silencing notifications.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                <span>After 4 focus sessions, take a longer 15-30 minute break to recharge.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                <span>Stay hydrated and maintain good posture to enhance productivity.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}