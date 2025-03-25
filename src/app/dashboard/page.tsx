// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  // Get recent sessions - order by end_time
  const { data: recentSessions } = await supabase
    .from("focus_sessions")
    .select(`
    *,
    task:task_id (id, name)
  `)
    .eq("user_id", profile?.id || '')
    .order("end_time", { ascending: false })
    .limit(10); // Increased limit to get more data for calculations

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

  // Get daily activity data for heatmap visualization
  const { data: dailyActivity } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", profile?.id || '')
    .order("date", { ascending: true });

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DashboardClient
        initialProfile={profile}
        initialRecentSessions={recentSessions || []}
        initialAchievements={achievementsWithProgress}
      />
    </Suspense>
  );
}