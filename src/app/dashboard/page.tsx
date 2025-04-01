// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import DashboardClient from "@/components/dashboard/DashboardClient";

// Import types directly from database.types
import {
  ProfileWithLevel,
  FocusSession,
  AchievementWithProgress,
  DailyActivity
} from "@/lib/supabase/database.types";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

async function fetchTodaySessions(userId: string): Promise<FocusSession[]> {
  const supabase = await createClient();
  const today = new Date();
  const todayISOString = today.toISOString().split('T')[0];

  const { data: todaySessions, error } = await supabase
    .from("focus_sessions")
    .select(`
      *,
      task:task_id (name)
    `)
    .eq("user_id", userId)
    .gte("end_time", todayISOString)
    .lt("end_time", new Date(today.getTime() + 86400000).toISOString().split('T')[0])
    .order("end_time", { ascending: false });

  if (error) {
    console.error("Error fetching today's sessions:", error);
    return [];
  }

  return todaySessions as FocusSession[];
}

async function fetchAllSessions(userId: string): Promise<FocusSession[]> {
  const supabase = await createClient();

  const { data: allSessions, error } = await supabase
    .from("focus_sessions")
    .select(`
      *,
      task:task_id (name)
    `)
    .eq("user_id", userId)
    .order("end_time", { ascending: false })
    .limit(100); // Limiting to the first 100 sessions

  if (error) {
    console.error("Error fetching all sessions:", error);
    return [];
  }

  return allSessions as FocusSession[];
}

async function fetchAchievements(userId: string): Promise<AchievementWithProgress[]> {
  const supabase = await createClient();

  // Fetch all achievements
  const { data: allAchievements, error: achievementsError } = await supabase
    .from("achievements")
    .select("*");

  if (achievementsError) {
    console.error("Error fetching achievements:", achievementsError);
    return [];
  }

  // Fetch user's achievement progress
  const { data: userAchievements, error: userAchievementsError } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievement_id (
        id,
        name,
        description,
        icon_name,
        category,
        requirement_type,
        requirement_value
      )
    `)
    .eq("user_id", userId);

  if (userAchievementsError) {
    console.error("Error fetching user achievements:", userAchievementsError);
    return [];
  }

  // Create a map of user's achievements
  const userAchievementsMap = new Map();
  userAchievements?.forEach(ua => {
    userAchievementsMap.set(ua.achievement_id, {
      progress: ua.progress,
      unlocked: ua.unlocked,
      unlocked_at: ua.unlocked_at
    });
  });

  // Combine achievements with user progress
  const achievementsWithProgress = allAchievements?.map(achievement => {
    const userProgress = userAchievementsMap.get(achievement.id);

    return {
      ...achievement,
      progress: userProgress?.progress || 0,
      unlocked: userProgress?.unlocked || false,
      unlocked_at: userProgress?.unlocked_at || null
    } as AchievementWithProgress;
  }) || [];

  return achievementsWithProgress;
}

async function fetchActivityData(userId: string): Promise<DailyActivity[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear(), 0, 1);

  const { data: activityData, error } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split('T')[0])
    .lte("date", new Date().toISOString().split('T')[0])
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching activity data:", error);
    return [];
  }

  return activityData as DailyActivity[];
}

async function fetchSessionStats(userId: string) {
  const supabase = await createClient();
  const today = new Date();

  const { data: totalStats } = await supabase.rpc('get_user_session_stats');

  const lastWeekDate = new Date(today);
  lastWeekDate.setDate(today.getDate() - 7);

  const lastMonthDate = new Date(today);
  lastMonthDate.setDate(today.getDate() - 30);

  const { data: periodSessions, error } = await supabase
    .from("focus_sessions")
    .select(`duration_minutes, end_time`)
    .eq("user_id", userId)
    .gte("end_time", lastMonthDate.toISOString());

  if (error) {
    console.error("Error fetching period sessions:", error);
    return {
      totalStats: { count: 0, total_minutes: 0 },
      periodStats: { last7Days: 0, last30Days: 0 }
    };
  }

  const last7Days = periodSessions?.filter(session =>
    new Date(session.end_time || '') >= lastWeekDate
  ).reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;

  const last30Days = periodSessions?.reduce((sum, session) =>
    sum + (session.duration_minutes || 0), 0) || 0;

  return {
    totalStats: totalStats[0] || { count: 0, total_minutes: 0 },
    periodStats: { last7Days, last30Days }
  };
}

export default async function DashboardPage() {
  // Get user profile and check authentication
  const profile = await getUserProfile();

  if (!profile) {
    // Redirect or handle unauthenticated user
    return <div>Unauthorized</div>;
  }

  // Fetch data in parallel for better performance
  const [
    todaySessions,
    allSessions, // Add this new data fetching
    achievements,
    activityData,
    { totalStats, periodStats }
  ] = await Promise.all([
    fetchTodaySessions(profile.id),
    fetchAllSessions(profile.id), // Add this new function call
    fetchAchievements(profile.id),
    fetchActivityData(profile.id),
    fetchSessionStats(profile.id)
  ]);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DashboardClient
        initialProfile={profile as ProfileWithLevel}
        initialTodaySessions={todaySessions}
        initialAllSessions={allSessions} // Pass the new data to DashboardClient
        initialAchievements={achievements}
        initialActivityData={activityData}
        periodStats={periodStats}
        totalStats={totalStats}
      />
    </Suspense>
  );
}