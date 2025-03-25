// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  // Get recent sessions - order by end_time now
  const { data: recentSessions } = await supabase
    .from("focus_sessions")
    .select(`
    *,
    task:task_id (id, name)
  `)
    .eq("user_id", profile?.id || '')
    .order("end_time", { ascending: false })
    .limit(5);

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

  // Format achievements for the client component
  const achievementsWithProgress = userAchievements?.map(ua => ({
    ...ua.achievement,
    progress: ua.progress,
    unlocked: ua.unlocked,
    unlocked_at: ua.unlocked_at
  })) || [];

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