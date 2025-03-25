// src/app/dashboard/achievements/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import AchievementsClient from "@/components/achievements/AchievementsClient";

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

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
    <Suspense fallback={<div>Cargando logros...</div>}>
      <AchievementsClient 
        initialAchievements={achievementsWithProgress}
        profile={profile}
      />
    </Suspense>
  );
}