// src/components/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import RecentAchievements from "@/components/achievements/RecentAchievements";
import { AchievementWithProgress } from "@/lib/supabase/database.types";

type Profile = {
  id: string;
  username: string;
  total_focus_time: number;
  streak_days: number;
  avatar_url?: string;
};

type Task = {
  id: string;
  name: string;
};

type FocusSession = {
  id: string;
  duration_minutes: number;
  end_time: string;
  task?: Task;
};

interface DashboardClientProps {
  initialProfile: Profile;
  initialRecentSessions: FocusSession[];
  initialAchievements?: AchievementWithProgress[];
}

export default function DashboardClient({ 
  initialProfile, 
  initialRecentSessions,
  initialAchievements = []
}: DashboardClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>(initialRecentSessions || []);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(initialAchievements);
  const [loading, setLoading] = useState(false);

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

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(userProfile);

      // Fetch recent sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("focus_sessions")
        .select(`
          *,
          task:task_id (id, name)
        `)
        .eq("user_id", user.id)
        .order("end_time", { ascending: false })
        .limit(3);

      if (sessionsError) throw sessionsError;
      setRecentSessions(sessions || []);

      // Fetch all achievements
      const { data: allAchievements, error: allAchievementsError } = await supabase
        .from("achievements")
        .select("*");

      if (allAchievementsError) throw allAchievementsError;

      // Fetch user achievements progress
      const { data: userAchievements, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievement_id (id)
        `)
        .eq("user_id", user.id);

      if (achievementsError) throw achievementsError;
      
      // Create a map of user achievements progress
      const userProgressMap = new Map();
      userAchievements.forEach(ua => {
        userProgressMap.set(ua.achievement_id, {
          progress: ua.progress,
          unlocked: ua.unlocked,
          unlocked_at: ua.unlocked_at
        });
      });
      
      // Format achievements with progress or default values
      const formattedAchievements = allAchievements.map(achievement => ({
        ...achievement,
        progress: userProgressMap.get(achievement.id)?.progress || 0,
        unlocked: userProgressMap.get(achievement.id)?.unlocked || false,
        unlocked_at: userProgressMap.get(achievement.id)?.unlocked_at || null
      }));
      
      setAchievements(formattedAchievements);

    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Bienvenido, {profile?.username || 'Usuario'}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Tiempo Total de Enfoque</CardTitle>
            <CardDescription className="text-gray-400">Tu progreso total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">
              {Math.floor((profile?.total_focus_time || 0) / 60)} hrs {(profile?.total_focus_time || 0) % 60} mins
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Racha Actual</CardTitle>
            <CardDescription className="text-gray-400">Días consecutivos de enfoque</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">{profile?.streak_days || 0} días</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Sesiones Recientes</CardTitle>
            <CardDescription className="text-gray-400">Tus últimas 3 sesiones de enfoque</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <ul className="space-y-2">
                {recentSessions.map((session) => (
                  <li key={session.id} className="text-sm border-l-2 border-purple-600 pl-3 py-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-white">{session.task?.name || "Sin tarea específica"}</span>
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
              <p className="text-sm text-gray-400">No tienes sesiones recientes</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <RecentAchievements achievements={achievements} />
      </div>

      <div className="mt-8">
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Reporte Semanal</CardTitle>
            <CardDescription className="text-gray-400">Tu tiempo de enfoque ésta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <p className="text-gray-400">Tu historial de enfoque aparecerá acá a medida que completes sesiones.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}