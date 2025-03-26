// src/components/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, subDays, isToday, startOfYear, eachDayOfInterval } from "date-fns";
import RecentAchievements from "@/components/achievements/RecentAchievements";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { 
  Trophy, 
  Edit2, 
  Save, 
  Calendar, 
  Clock, 
  BarChart, 
  Target,
  Flame,
  Award,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ProfileWithLevel, 
  DailyActivity, 
  AchievementWithProgress 
} from "@/lib/supabase/database.types";

// Define level thresholds in minutes
const LEVELS = [
  { name: "Bronce", threshold: 0, color: "from-amber-700 to-amber-500", textColor: "text-amber-400" },
  { name: "Plata", threshold: 3000, color: "from-gray-400 to-gray-300", textColor: "text-gray-300" },      // 50 hours
  { name: "Oro", threshold: 6000, color: "from-yellow-500 to-yellow-300", textColor: "text-yellow-400" },  // 100 hours
  { name: "Platino", threshold: 12000, color: "from-cyan-600 to-cyan-400", textColor: "text-cyan-400" },   // 200 hours
  { name: "Diamante", threshold: 24000, color: "from-purple-600 to-blue-400", textColor: "text-blue-400" } // 400 hours
];

// Get user level based on total minutes
const getUserLevel = (totalMinutes: number) => {
  let level = LEVELS[0];
  for (let i = 1; i < LEVELS.length; i++) {
    if (totalMinutes >= LEVELS[i].threshold) {
      level = LEVELS[i];
    } else {
      break;
    }
  }
  return level;
};

// Get progress to next level
const getProgressToNextLevel = (totalMinutes: number) => {
  const currentLevel = getUserLevel(totalMinutes);
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  const isMaxLevel = currentLevelIndex === LEVELS.length - 1;
  
  if (isMaxLevel) return 100; // Max level reached
  
  const nextLevel = LEVELS[currentLevelIndex + 1];
  const progressInCurrentLevel = totalMinutes - currentLevel.threshold;
  const currentLevelRange = nextLevel.threshold - currentLevel.threshold;
  
  return Math.min(Math.round((progressInCurrentLevel / currentLevelRange) * 100), 99);
};

// Get next level info
const getNextLevelInfo = (totalMinutes: number) => {
  const currentLevel = getUserLevel(totalMinutes);
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  const isMaxLevel = currentLevelIndex === LEVELS.length - 1;
  
  if (isMaxLevel) return { name: null, minutesNeeded: 0 };
  
  const nextLevel = LEVELS[currentLevelIndex + 1];
  const minutesNeeded = nextLevel.threshold - totalMinutes;
  
  return { name: nextLevel.name, minutesNeeded };
};

type FocusSession = {
  id: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  task?: { name: string };
};

interface DashboardClientProps {
  initialProfile: ProfileWithLevel;
  initialRecentSessions: FocusSession[];
  initialAchievements?: AchievementWithProgress[];
}

export default function DashboardClient({ 
  initialProfile, 
  initialRecentSessions,
  initialAchievements = []
}: DashboardClientProps) {
  const [profile, setProfile] = useState<ProfileWithLevel>({
    ...initialProfile,
    daily_motivation: initialProfile.daily_motivation || "Focus on the process, not just the outcome",
    target_hours: initialProfile.target_hours || 100,
    best_streak: initialProfile.best_streak || 0,
    levelProgress: 0
  });
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>(initialRecentSessions || []);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(initialAchievements);
  const [editingMotivation, setEditingMotivation] = useState(false);
  const [motivationText, setMotivationText] = useState(profile.daily_motivation || "");
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetHours, setTargetHours] = useState(profile.target_hours || 100);
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [todaySessions, setTodaySessions] = useState<{ count: number, minutes: number }>({ count: 0, minutes: 0 });
  const [periodStats, setPeriodStats] = useState({
    last7Days: 0,
    last30Days: 0
  });
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(true);

  // Get current level info
  const currentLevel = getUserLevel(profile.total_focus_time || 0);
  const levelProgress = getProgressToNextLevel(profile.total_focus_time || 0);
  const nextLevelInfo = getNextLevelInfo(profile.total_focus_time || 0);

  // Fetch today's sessions and period stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsStatsLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get today's date and format it for comparison
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const sevenDaysAgo = subDays(today, 7);
        const thirtyDaysAgo = subDays(today, 30);

        // Get focus sessions for the last 30 days
        const { data: sessions, error } = await supabase
          .from("focus_sessions")
          .select("duration_minutes, end_time")
          .eq("user_id", user.id)
          .gte("end_time", thirtyDaysAgo.toISOString())
          .order("end_time", { ascending: false });

        if (error) throw error;

        // Calculate today's sessions
        const todaySessions = sessions.filter(session => {
          const sessionDate = new Date(session.end_time);
          return isToday(sessionDate);
        });

        const todayCount = todaySessions.length;
        const todayMinutes = todaySessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);

        setTodaySessions({
          count: todayCount,
          minutes: todayMinutes
        });

        // Calculate period stats
        let last7DaysMinutes = 0;
        let last30DaysMinutes = 0;

        sessions.forEach(session => {
          const sessionDate = new Date(session.end_time);
          
          if (sessionDate >= sevenDaysAgo) {
            last7DaysMinutes += session.duration_minutes || 0;
          }
          
          last30DaysMinutes += session.duration_minutes || 0;
        });

        setPeriodStats({
          last7Days: last7DaysMinutes,
          last30Days: last30DaysMinutes
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch activity data for heatmap
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setIsActivityLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startDate = startOfYear(new Date());
        const endDate = new Date();

        // Get daily activity data
        const { data, error } = await supabase
          .from("daily_activity")
          .select("date, total_minutes, sessions_count")
          .eq("user_id", user.id)
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0])
          .order("date", { ascending: true });

        if (error) throw error;

        // Create a map of dates
        const activityMap = new Map();
        data.forEach(day => {
          activityMap.set(day.date, {
            total_minutes: day.total_minutes,
            sessions_count: day.sessions_count
          });
        });

        // Generate all days in the interval
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const completeData = allDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const activity = activityMap.get(dateStr);
          return {
            date: dateStr,
            total_minutes: activity ? activity.total_minutes : 0,
            sessions_count: activity ? activity.sessions_count : 0,
            id: '',  // Add required id field for DailyActivity type
            user_id: user.id, // Add required user_id field
            created_at: dateStr, // Add required created_at field
            updated_at: dateStr, // Add required updated_at field
          };
        });

        setActivityData(completeData);

      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setIsActivityLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  // Load achievements
  useEffect(() => {
    setIsAchievementsLoading(achievements.length === 0);
    
    // If we already have achievements loaded, we can stop loading
    if (achievements.length > 0) {
      setIsAchievementsLoading(false);
    }
  }, [achievements]);

  // Save motivation text
  const saveMotivation = async () => {
    try {
      setLoading(true);

      // Call the RPC to update the motivation
      const { error } = await supabase.rpc("update_daily_motivation", {
        motivation: motivationText
      });

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        daily_motivation: motivationText
      });

      setEditingMotivation(false);
      toast.success("Motivación actualizada");
    } catch (error) {
      console.error("Error updating motivation:", error);
      toast.error("Error al actualizar la motivación");
    } finally {
      setLoading(false);
    }
  };

  // Save target hours
  const saveTargetHours = async () => {
    try {
      setLoading(true);

      const hours = parseInt(targetHours.toString());
      if (isNaN(hours) || hours <= 0) {
        toast.error("Por favor ingresa un número válido");
        return;
      }

      // Call the RPC to update the target hours
      const { error } = await supabase.rpc("update_target_hours", {
        hours
      });

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        target_hours: hours
      });

      setEditingTarget(false);
      toast.success("Meta de horas actualizada");
    } catch (error) {
      console.error("Error updating target hours:", error);
      toast.error("Error al actualizar la meta de horas");
    } finally {
      setLoading(false);
    }
  };

  // Format minutes to hours and minutes
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h:${mins}m`;
  };

  // Calculate target hours progress
  const targetHoursProgress = () => {
    const targetMinutes = (profile.target_hours || 100) * 60;
    const percentage = Math.min(Math.round((profile.total_focus_time / targetMinutes) * 100), 100);
    return percentage;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Bienvenido, {profile?.username || 'Usuario'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Level, Motivation and Focus Data */}
        <Card className="bg-[#1a1a2e] border-gray-800 overflow-hidden">
          {/* Level section */}
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              {isStatsLoading ? (
                <>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="w-24 h-5 mb-1" />
                      <Skeleton className="w-40 h-4" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="w-20 h-4 mb-1 ml-auto" />
                    <Skeleton className="w-24 h-5 ml-auto" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {/* Award icon in a circle */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#262638] border-2 border-purple-400">
                      <Award className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400 font-bold">{currentLevel.name}</span>
                        <span className="text-white">Nivel {LEVELS.findIndex(l => l.name === currentLevel.name) + 1}</span>
                      </div>
                      <CardDescription className="text-gray-400">
                        {nextLevelInfo.name ? 
                          `${formatMinutes(nextLevelInfo.minutesNeeded)} más para alcanzar el nivel ${nextLevelInfo.name}` : 
                          "¡Has alcanzado el nivel máximo!"
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400">Tiempo Total</span>
                    <div className="text-white font-semibold">{formatMinutes(profile.total_focus_time || 0)}</div>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Progreso</span>
                <span className="text-sm text-gray-400">{levelProgress}%</span>
              </div>
              {isStatsLoading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress 
                  value={levelProgress} 
                  className="h-2 bg-gray-700"
                />
              )}
            </div>
            
            {/* Streak info */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {isStatsLoading ? (
                <>
                  <Skeleton className="h-16 bg-[#262638]" />
                  <Skeleton className="h-16 bg-[#262638]" />
                </>
              ) : (
                <>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Racha Actual</span>
                      </div>
                      <div className="text-xl font-bold text-purple-400 mt-1">{profile?.streak_days || 0} días</div>
                    </div>
                  </div>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Mejor Racha</span>
                      </div>
                      <div className="text-xl font-bold text-purple-400 mt-1">{profile?.best_streak || 0} días</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          
          {/* Daily Motivation section */}
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Motivación Diaria</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (editingMotivation) {
                    saveMotivation();
                  } else {
                    setEditingMotivation(true);
                  }
                }}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                {editingMotivation ? 
                  (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-400" />) : 
                  <Edit2 className="h-4 w-4 text-gray-400" />
                }
              </Button>
            </div>
            {editingMotivation ? (
              <div className="flex flex-col space-y-2">
                <Input
                  value={motivationText}
                  onChange={(e) => setMotivationText(e.target.value)}
                  className="bg-[#262638] border-gray-700 text-white"
                  placeholder="Escribe tu motivación..."
                  disabled={loading}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingMotivation(false);
                      setMotivationText(profile.daily_motivation || "");
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={saveMotivation}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : "Guardar"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 italic text-lg">"{profile.daily_motivation || 'Focus on the process, not just the outcome'}"</p>
            )}
          </div>
          
          {/* Focus Data section */}
          <div className="border-t border-gray-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-white mb-4">Datos de Enfoque</h3>
            <div className="grid grid-cols-2 gap-4">
              {isStatsLoading ? (
                <>
                  <Skeleton className="h-16 bg-[#262638]" />
                  <Skeleton className="h-16 bg-[#262638]" />
                </>
              ) : (
                <>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Últimos 7 días</span>
                      </div>
                      <div className="text-xl font-bold text-purple-400 mt-1">{formatMinutes(periodStats.last7Days)}</div>
                    </div>
                  </div>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Últimos 30 días</span>
                      </div>
                      <div className="text-xl font-bold text-purple-400 mt-1">{formatMinutes(periodStats.last30Days)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Right column: Today's Focus and Total Progress */}
        <Card className="bg-[#1a1a2e] border-gray-800 overflow-hidden">
          {/* Today's Focus Data section */}
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Hoy
            </CardTitle>
            <CardDescription className="text-gray-400">Datos de enfoque del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {isStatsLoading ? (
                <>
                  <Skeleton className="h-16 bg-[#262638]" />
                  <Skeleton className="h-16 bg-[#262638]" />
                </>
              ) : (
                <>
                  <div className="bg-[#262638] p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Sesiones</div>
                    <div className="text-2xl font-bold text-purple-400">{todaySessions.count}</div>
                  </div>
                  <div className="bg-[#262638] p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Duración</div>
                    <div className="text-2xl font-bold text-purple-400">{formatMinutes(todaySessions.minutes)}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          {/* Total Progress section */}
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart className="h-5 w-5 text-purple-400" />
                Progreso Total
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (editingTarget) {
                    saveTargetHours();
                  } else {
                    setEditingTarget(true);
                  }
                }}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                {editingTarget ? 
                  (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-400" />) : 
                  <Edit2 className="h-4 w-4 text-gray-400" />
                }
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isStatsLoading ? (
                  <>
                    <Skeleton className="h-16 bg-[#262638]" />
                    <Skeleton className="h-16 bg-[#262638]" />
                  </>
                ) : (
                  <>
                    <div className="bg-[#262638] p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Sesiones Totales</div>
                      <div className="text-2xl font-bold text-purple-400">{recentSessions.length}</div>
                    </div>
                    <div className="bg-[#262638] p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Tiempo Total</div>
                      <div className="text-2xl font-bold text-purple-400">{formatMinutes(profile.total_focus_time || 0)}</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Target hours at the bottom */}
              <div className="mt-auto pt-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Meta de Horas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingTarget ? (
                      <Input
                        type="number"
                        min="1"
                        value={targetHours}
                        onChange={(e) => setTargetHours(parseInt(e.target.value) || 0)}
                        className="w-16 h-6 py-1 px-2 bg-[#262638] border-gray-700 text-white"
                        disabled={loading}
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">{profile.target_hours || 100}hr</span>
                    )}
                  </div>
                </div>
                {isStatsLoading ? (
                  <Skeleton className="h-2 w-full mb-1" />
                ) : (
                  <>
                    <Progress 
                      value={targetHoursProgress()} 
                      className="h-2 bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{targetHoursProgress()}% completado</span>
                      <span>{formatMinutes(profile.total_focus_time || 0)} / {profile.target_hours || 100}hr</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="mt-6 mb-6">
        <RecentAchievements 
          achievements={achievements} 
          isLoading={isAchievementsLoading} 
        />
      </div>

      {/* Activity Heatmap */}
      <div>
        <ActivityHeatmap 
          activityData={activityData} 
          isLoading={isActivityLoading} 
        />
      </div>
    </div>
  );
}