"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Settings,
  LayoutGrid,
  Flame
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TimerSettings from "@/components/timer/TimerSettings";
import FocusTimer from "@/components/timer/FocusTimer";
import TaskManager from "@/components/timer/TaskManager";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Task, TimerSetting } from "@/lib/supabase/database.types";

type FocusSession = {
  id: string;
  duration_minutes: number;
  end_time: string;
  notes?: string;
  task?: {
    name: string;
  };
};

type Profile = {
  id: string;
  username?: string;
  total_focus_time: number;
  streak_days: number;
};

interface HubPageClientProps {
  initialTimerSettings: TimerSetting;
  initialRecentTasks: Task[];
  initialRecentSessions: FocusSession[];
  initialProfile: Profile;
}

export default function HubPageClient({
  initialTimerSettings,
  initialRecentTasks,
  initialRecentSessions,
  initialProfile
}: HubPageClientProps) {
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

      // Fetch recent tasks - ensure we filter out deleted tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (tasksError) throw tasksError;
      setRecentTasks(tasks || []);

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayISOString = today.toISOString().split('T')[0];

      // Fetch today's sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("focus_sessions")
        .select("*, task:task_id(name)")
        .eq("user_id", user.id)
        .gte("end_time", todayISOString)
        .lt("end_time", new Date(today.getTime() + 86400000).toISOString().split('T')[0])
        .order("end_time", { ascending: false });

      if (sessionsError) throw sessionsError;
      setRecentSessions(sessions || []);

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, total_focus_time, streak_days")
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

  // Format minutes to hours and minutes
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate today's total minutes
  const calculateTodaysTotalMinutes = () => {
    return recentSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Centro de Enfoque</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Timer Tabs Component */}
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-[#1a1a2e] border border-gray-800 w-full h-auto">
              <TabsTrigger value="timer" className="flex-1 flex-col sm:flex-row h-auto py-2 px-1">
                <Clock className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                <span className="text-sm whitespace-normal text-center">Temporizador</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 flex-col sm:flex-row h-auto py-2 px-1">
                <Settings className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                <span className="text-sm whitespace-normal text-center">Configuración</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1 flex-col sm:flex-row h-auto py-2 px-1">
                <LayoutGrid className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                <span className="text-sm whitespace-normal text-center">Tareas</span>
              </TabsTrigger>
            </TabsList>

            {/* Timer Tab Content */}
            <TabsContent value="timer" className="mt-6">
              <FocusTimer
                defaultFocusTime={timerSettings?.focus_time || 25}
                defaultBreakLength={timerSettings?.break_length || 5}
                defaultTargetSessions={timerSettings?.target_sessions || 4}
                techniqueId={timerSettings?.technique_id || "custom"}
                onSessionComplete={handleSessionComplete}
                onTaskStatusChange={handleTasksChanged}
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
          {/* Combined Stats Card - Focus Time, Streak and Today's Sessions */}
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardContent className="p-0">
              {/* Top row: Focus Time and Streak */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-800">
                {/* Left side - Focus Time */}
                <div className="p-5 text-center">
                  <div className="h-6 flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-400" />
                    <h3 className="text-white text-base font-medium">Tiempo</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-400 mt-2">
                    {formatMinutes(profile?.total_focus_time || 0)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Tiempo total acumulado</p>
                </div>

                {/* Right side - Streak */}
                <div className="p-5 text-center">
                  <div className="h-6 flex items-center justify-center">
                    <Flame className="h-4 w-4 mr-2 text-orange-400" />
                    <h3 className="text-white text-base font-medium">Racha Actual</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-400 mt-2">{profile?.streak_days || 0} días</p>
                  <p className="text-gray-400 text-xs mt-1">Días consecutivos activo</p>
                </div>
              </div>

              {/* Horizontal divider */}
              <div className="border-t border-gray-800"></div>

              {/* Bottom section - Today's Sessions */}
              <div className="p-5">
                <h3 className="text-white text-base font-medium mb-3 text-center">Hoy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="text-gray-400 text-xs mb-1">Sesiones</div>
                    <div className="text-xl font-bold text-purple-400">
                      {recentSessions.length}
                    </div>
                  </div>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="text-gray-400 text-xs mb-1">Tiempo Total</div>
                    <div className="text-xl font-bold text-purple-400">
                      {formatMinutes(calculateTodaysTotalMinutes())}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Technique Card */}
          {timerSettings && (
            <Card className="bg-[#1a1a2e] border-gray-800 mb-24">
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
        </div>
      </div>
    </div>
  );
}