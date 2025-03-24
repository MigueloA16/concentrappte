"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Settings, LayoutGrid, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TimerSettings from "@/components/timer/TimerSettings";
import FocusTimer from "@/components/timer/FocusTimer";
import TaskManager from "@/components/timer/TaskManager";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

// Define types for our data
type TimerSetting = {
  id: string;
  focus_time: number;
  break_length: number;
  target_sessions: number;
  technique_id: string;
  technique?: {
    name: string;
    description: string;
  };
};

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

type FocusSession = {
  id: string;
  duration_minutes: number;
  end_time: string; // Make sure end_time is included in the type
  task?: {
    name: string;
  };
};

type Profile = {
  total_focus_time: number;
  streak_days: number;
};

export default function HubPageClient({ 
  initialTimerSettings, 
  initialRecentTasks, 
  initialRecentSessions,
  initialProfile
}: { 
  initialTimerSettings: TimerSetting;
  initialRecentTasks: Task[];
  initialRecentSessions: FocusSession[];
  initialProfile: Profile;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || "timer");
  const [timerSettings, setTimerSettings] = useState<TimerSetting | null>(initialTimerSettings);
  const [recentTasks, setRecentTasks] = useState<Task[]>(initialRecentTasks || []);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>(initialRecentSessions || []);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [loading, setLoading] = useState(false);

  // Handle tab changes via URL
  useEffect(() => {
    if (tabParam && ["timer", "settings", "tasks"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when tabs change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // Handle task status changes (completion, etc)
const handleTaskStatusChange = () => {
    refreshData();
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    // Check if the date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      // For today, show the time
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if the date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();
                      
    if (isYesterday) {
      return "Ayer";
    }
    
    // Otherwise show the date
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  // Refresh data function for when settings or tasks are changed
  const refreshData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch timer settings
      const { data: settings, error: settingsError } = await supabase
        .from("timer_settings")
        .select("*, technique:technique_id(name, description)")
        .eq("user_id", user.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      if (settings) {
        setTimerSettings(settings);
      }

      // Fetch recent tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (tasksError) throw tasksError;
      setRecentTasks(tasks || []);

      // Fetch recent sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("focus_sessions")
        .select("*, task:task_id(name)")
        .eq("user_id", user.id)
        .order("end_time", { ascending: false })  // Order by end_time instead of start_time
        .limit(5);

      if (sessionsError) throw sessionsError;
      setRecentSessions(sessions || []);

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("total_focus_time, streak_days")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(userProfile);

    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for timer settings changes
  const handleTimerSettingsChanged = () => {
    refreshData();
  };

  // Handler for tasks changes
  const handleTasksChanged = () => {
    refreshData();
  };
  
  // Handle session completion
  const handleSessionComplete = () => {
    refreshData();
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Centro de Enfoque</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Timer Tabs Component */}
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-[#1a1a2e] border border-gray-800 w-full">
              <TabsTrigger value="timer" className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Temporizador
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Tareas
              </TabsTrigger>
            </TabsList>

            {/* Timer Tab Content */}
            <TabsContent value="timer" className="mt-6">
              <FocusTimer
                defaultFocusTime={timerSettings?.focus_time || 25}
                defaultBreakLength={timerSettings?.break_length || 5}
                defaultTargetSessions={timerSettings?.target_sessions || 4}
                recentTasks={recentTasks || []}
                techniqueId={timerSettings?.technique_id || "custom"}
                onSessionComplete={handleSessionComplete}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </TabsContent>

            {/* Settings Tab Content */}
            <TabsContent value="settings" className="mt-6">
              <TimerSettings 
                initialSettings={timerSettings} 
                onSettingsChanged={handleTimerSettingsChanged}
              />
            </TabsContent>

            {/* Tasks Tab Content */}
            <TabsContent value="tasks" className="mt-6">
              <TaskManager 
                tasks={recentTasks || []} 
                onTasksChanged={handleTasksChanged}
              />
            </TabsContent>
          </Tabs>

          {/* Tips Card */}
          <Card className="w-full bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Consejos para Enfocarse</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  <span>Trabaja en sesiones de 25 minutos con descansos de 5 minutos para un enfoque óptimo.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  <span>Elimina distracciones cerrando pestañas innecesarias y silenciando notificaciones.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  <span>Después de 4 sesiones de enfoque, toma un descanso más largo de 15-30 minutos para recargar.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-purple-600 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  <span>Mantente hidratado y conserva una buena postura para mejorar la productividad.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Statistics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Stats Card */}
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Tiempo de Enfoque Total</CardTitle>
              <CardDescription className="text-gray-400">Tu progreso general</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">
                {Math.floor((profile?.total_focus_time || 0) / 60)} hrs {(profile?.total_focus_time || 0) % 60} mins
              </p>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Racha Actual</CardTitle>
              <CardDescription className="text-gray-400">Días consecutivos enfocado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">{profile?.streak_days || 0} días</p>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Sesiones Recientes</CardTitle>
              <CardDescription className="text-gray-400">Tus últimas 5 sesiones de enfoque</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions && recentSessions.length > 0 ? (
                <ul className="space-y-2">
                  {recentSessions.map((session) => (
                    <li key={session.id} className="text-sm border-l-2 border-purple-600 pl-3 py-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-white">{session.task?.name || "Sin tarea"}</span>
                        <span className="text-gray-500 text-xs">
                          {formatDate(session.end_time)}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {session.duration_minutes ? `${session.duration_minutes}m` : "En progreso"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No hay sesiones recientes</p>
              )}
            </CardContent>
          </Card>

          {/* Current Technique Card */}
          {timerSettings && (
            <Card className="bg-[#1a1a2e] border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white">Técnica Actual</CardTitle>
                <CardDescription className="text-gray-400">
                  {timerSettings.technique?.name || "Personalizada"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Enfoque:</span>
                    <span className="font-medium text-white">{timerSettings.focus_time} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Descanso:</span>
                    <span className="font-medium text-white">{timerSettings.break_length} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sesiones objetivo:</span>
                    <span className="font-medium text-white">{timerSettings.target_sessions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Start Button */}
          <Button className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
            onClick={() => {
              setActiveTab("timer");
              handleTabChange("timer");
            }}>
            <Play className="h-5 w-5 mr-2" />
            Iniciar Enfoque Rápido
          </Button>
        </div>
      </div>
    </div>
  );
}