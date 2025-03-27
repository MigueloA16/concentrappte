// src/components/dashboard/DashboardClient.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

// Icons
import {
  Trophy,
  Edit2,
  Save,
  Clock,
  BarChart,
  Target,
  Flame,
  Award,
  Loader2
} from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Custom Components
import RecentAchievements from "@/components/achievements/RecentAchievements";
import RecentSessions from "@/components/dashboard/RecentSessions";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";

// Types
import {
  ProfileWithLevel,
  DailyActivity,
  AchievementWithProgress,
  FocusSession
} from "@/lib/supabase/database.types";

// Constants
const LEVELS = [
  { name: "Bronce", threshold: 0, color: "from-amber-700 to-amber-500", textColor: "text-amber-400" },
  { name: "Plata", threshold: 3000, color: "from-gray-400 to-gray-300", textColor: "text-gray-300" },
  { name: "Oro", threshold: 6000, color: "from-yellow-500 to-yellow-300", textColor: "text-yellow-400" },
  { name: "Platino", threshold: 12000, color: "from-cyan-600 to-cyan-400", textColor: "text-cyan-400" },
  { name: "Diamante", threshold: 24000, color: "from-purple-600 to-blue-400", textColor: "text-blue-400" }
];

// Utility Functions
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

const getProgressToNextLevel = (totalMinutes: number) => {
  const currentLevel = getUserLevel(totalMinutes);
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  const isMaxLevel = currentLevelIndex === LEVELS.length - 1;

  if (isMaxLevel) return 100;

  const nextLevel = LEVELS[currentLevelIndex + 1];
  const progressInCurrentLevel = totalMinutes - currentLevel.threshold;
  const currentLevelRange = nextLevel.threshold - currentLevel.threshold;

  return Math.min(Math.round((progressInCurrentLevel / currentLevelRange) * 100), 99);
};

const getNextLevelInfo = (totalMinutes: number) => {
  const currentLevel = getUserLevel(totalMinutes);
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  const isMaxLevel = currentLevelIndex === LEVELS.length - 1;

  if (isMaxLevel) return { name: null, minutesNeeded: 0 };

  const nextLevel = LEVELS[currentLevelIndex + 1];
  const minutesNeeded = nextLevel.threshold - totalMinutes;

  return { name: nextLevel.name, minutesNeeded };
};

// Component Props Interface
interface DashboardClientProps {
  initialProfile: ProfileWithLevel;
  initialTodaySessions: FocusSession[];
  initialAchievements?: AchievementWithProgress[];
  initialActivityData?: DailyActivity[];
  periodStats?: {
    last7Days: number;
    last30Days: number;
  };
  totalStats?: {
    count: number;
    total_minutes: number;
  };
}

export default function DashboardClient({
  initialProfile,
  initialTodaySessions,
  initialAchievements = [],
  initialActivityData = [],
  periodStats = { last7Days: 0, last30Days: 0 },
  totalStats = { count: 0, total_minutes: 0 }
}: DashboardClientProps) {
  // Initial State Setup
  const [profile, setProfile] = useState<ProfileWithLevel>({
    ...initialProfile,
    daily_motivation: initialProfile.daily_motivation || "Focus on the process, not just the outcome",
    target_hours: initialProfile.target_hours || 100,
    best_streak: initialProfile.best_streak || 0,
    levelProgress: 0
  });
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>(initialTodaySessions || []);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(initialAchievements);
  const [activityData, setActivityData] = useState<DailyActivity[]>(initialActivityData);

  // Editing States
  const [editingMotivation, setEditingMotivation] = useState(false);
  const [motivationText, setMotivationText] = useState(profile.daily_motivation || "");
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetHours, setTargetHours] = useState(profile.target_hours || 100);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(initialActivityData.length === 0);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(initialAchievements.length === 0);
  const [isSessionsLoading, setIsSessionsLoading] = useState(initialTodaySessions.length === 0);

  // Memoized Calculations
  const levelInfo = useMemo(() => {
    const currentLevel = getUserLevel(profile.total_focus_time || 0);
    const levelProgress = getProgressToNextLevel(profile.total_focus_time || 0);
    const nextLevelInfo = getNextLevelInfo(profile.total_focus_time || 0);

    return {
      currentLevel,
      levelProgress,
      nextLevelInfo
    };
  }, [profile.total_focus_time]);

  // Utility Callbacks
  const formatMinutes = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h:${mins}m`;
  }, []);

  const calculateTodaysTotalMinutes = useCallback(() => {
    return todaySessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);
  }, [todaySessions]);

  const targetHoursProgress = useCallback(() => {
    const targetMinutes = (profile.target_hours || 100) * 60;
    const percentage = Math.min(Math.round((profile.total_focus_time / targetMinutes) * 100), 100);
    return percentage;
  }, [profile.target_hours, profile.total_focus_time]);

  // Effects
  useEffect(() => {
    // Initial loading state management
    if (initialActivityData.length > 0) {
      setIsStatsLoading(false);
    }

    if (initialAchievements.length > 0) {
      setIsAchievementsLoading(false);
    }

    if (initialTodaySessions.length > 0) {
      setIsSessionsLoading(false);
    }
  }, [initialActivityData, initialAchievements, initialTodaySessions]);

  // Save Motivation Callback
  const saveMotivation = useCallback(async () => {
    try {
      setLoading(true);

      const { error } = await supabase.rpc("update_daily_motivation", {
        motivation: motivationText
      });

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        daily_motivation: motivationText
      }));

      setEditingMotivation(false);
      toast.success("Motivación actualizada");
    } catch (error) {
      console.error("Error updating motivation:", error);
      toast.error("Error al actualizar la motivación");
    } finally {
      setLoading(false);
    }
  }, [motivationText]);

  // Save Target Hours Callback
  const saveTargetHours = useCallback(async () => {
    try {
      setLoading(true);

      const hours = parseInt(targetHours.toString());
      if (isNaN(hours) || hours <= 0) {
        toast.error("Por favor ingresa un número válido");
        return;
      }

      const { error } = await supabase.rpc("update_target_hours", { hours });

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        target_hours: hours
      }));

      setEditingTarget(false);
      toast.success("Meta de horas actualizada");
    } catch (error) {
      console.error("Error updating target hours:", error);
      toast.error("Error al actualizar la meta de horas");
    } finally {
      setLoading(false);
    }
  }, [targetHours]);

  // Refresh Sessions Callback
  const handleSessionsUpdated = useCallback(async () => {
    try {
      setIsSessionsLoading(true);

      const today = new Date();
      const todayISOString = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("focus_sessions")
        .select(`
          *,
          task:task_id (id, name)
        `)
        .eq("user_id", profile?.id || '')
        .gte("end_time", todayISOString)
        .lt("end_time", new Date(today.getTime() + 86400000).toISOString().split('T')[0])
        .order("end_time", { ascending: false });

      if (error) throw error;

      setTodaySessions(data || []);
    } catch (error) {
      console.error("Error refreshing sessions:", error);
      toast.error("Error al actualizar sesiones");
    } finally {
      setIsSessionsLoading(false);
    }
  }, [profile?.id]);

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
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#262638] border-2 border-purple-400">
                      <Award className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400 font-bold">{levelInfo.currentLevel.name}</span>
                        <span className="text-white">Nivel {LEVELS.findIndex(l => l.name === levelInfo.currentLevel.name) + 1}</span>
                      </div>
                      <CardDescription className="text-gray-400">
                        {levelInfo.nextLevelInfo.name ?
                          `${formatMinutes(levelInfo.nextLevelInfo.minutesNeeded)} más para alcanzar el nivel ${levelInfo.nextLevelInfo.name}` :
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
                <span className="text-sm text-gray-400">{levelInfo.levelProgress}%</span>
              </div>
              {isStatsLoading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress
                  value={levelInfo.levelProgress}
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
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span className="text-white-400 font-bold text-sm">Racha Actual</span>
                      </div>
                      <div className="text-xl font-bold text-orange-400 mt-1">{profile?.streak_days || 0} días</div>
                    </div>
                  </div>
                  <div className="bg-[#262638] p-3 rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        <span className="text-white-400 font-bold text-sm">Mejor Racha</span>
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
                    <div className="text-2xl font-bold text-purple-400">{todaySessions.length}</div>
                  </div>
                  <div className="bg-[#262638] p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Duración</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {formatMinutes(calculateTodaysTotalMinutes())}
                    </div>
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
                      <div className="text-2xl font-bold text-purple-400">{totalStats.count}</div>
                    </div>
                    <div className="bg-[#262638] p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Tiempo Total</div>
                      <div className="text-2xl font-bold text-purple-400">{formatMinutes(totalStats.total_minutes)}</div>
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

      {/* Side-by-side Recent Sessions and Achievements for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="h-full flex flex-col">
          <div className="flex-1 flex flex-col">
            <RecentSessions
              sessions={todaySessions}
              isLoading={isSessionsLoading}
              onSessionUpdated={handleSessionsUpdated}
            />
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="h-full flex flex-col">
          <div className="flex-1 flex flex-col">
            <RecentAchievements
              achievements={achievements}
              isLoading={isAchievementsLoading}
            />
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="hidden md:block">
        <ActivityHeatmap
          activityData={activityData}
          isLoading={isStatsLoading}
        />
      </div>
    </div>
  );
}