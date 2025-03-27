// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  // Get today's sessions - order by end_time
  const today = new Date();
  const todayISOString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const { data: todaySessions } = await supabase
    .from("focus_sessions")
    .select(`
      *,
      task:task_id (id, name)
    `)
    .eq("user_id", profile?.id || '')
    .gte("end_time", todayISOString) // Filter for sessions from today
    .lt("end_time", new Date(today.getTime() + 86400000).toISOString().split('T')[0]) // Before tomorrow
    .order("end_time", { ascending: false });

  // Get total sessions count and total time 
  const { data: totalStats } = await supabase
    .rpc('get_user_session_stats');

  // Get session stats for the last 7 and 30 days
  const lastWeekDate = new Date(today);
  lastWeekDate.setDate(today.getDate() - 7);
  
  const lastMonthDate = new Date(today);
  lastMonthDate.setDate(today.getDate() - 30);
  
  const { data: periodSessions } = await supabase
    .from("focus_sessions")
    .select(`duration_minutes, end_time`)
    .eq("user_id", profile?.id || '')
    .gte("end_time", lastMonthDate.toISOString());

  // Calculate stats for the periods
  const last7Days = periodSessions?.filter(session => 
    new Date(session.end_time || '') >= lastWeekDate
  ).reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
  
  const last30Days = periodSessions?.reduce((sum, session) => 
    sum + (session.duration_minutes || 0), 0) || 0;

  // Get daily activity data for heatmap
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear(), 0, 1); // Start of year
  
  const { data: activityData } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", profile?.id || '')
    .gte("date", startDate.toISOString().split('T')[0])
    .lte("date", today.toISOString().split('T')[0])
    .order("date", { ascending: true });

  // Get ALL achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  // Get user achievements with their details
  const { data: userAchievements } = await supabase
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
    .eq("user_id", profile?.id || '');

  // Create a map of user's achievements by achievement_id
  const userAchievementsMap = new Map();
  userAchievements?.forEach(ua => {
    userAchievementsMap.set(ua.achievement_id, {
      progress: ua.progress,
      unlocked: ua.unlocked,
      unlocked_at: ua.unlocked_at
    });
  });

  // Format achievements for the client component, including ALL achievements
  const achievementsWithProgress = allAchievements?.map(achievement => {
    const userProgress = userAchievementsMap.get(achievement.id);
    
    return {
      ...achievement,
      progress: userProgress?.progress || 0,
      unlocked: userProgress?.unlocked || false,
      unlocked_at: userProgress?.unlocked_at || null
    };
  }) || [];

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DashboardClient
        initialProfile={profile}
        initialRecentSessions={todaySessions || []}
        initialAchievements={achievementsWithProgress}
        initialActivityData={activityData || []}
        periodStats={{
          last7Days,
          last30Days
        }}
        totalStats={totalStats[0] || { count: 0, total_minutes: 0 }}
      />
    </Suspense>
  );
}