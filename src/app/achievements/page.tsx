// src/app/achievements/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import AchievementsClient from "@/components/achievements/AchievementsClient";

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  // Get ALL achievements from the achievements table
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  // Get user's achievement progress
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

  // Create a map of the user's achievements by achievement_id
  const userAchievementsMap = new Map();
  userAchievements?.forEach(ua => {
    userAchievementsMap.set(ua.achievement_id, {
      progress: ua.progress,
      unlocked: ua.unlocked,
      unlocked_at: ua.unlocked_at
    });
  });

  // Format achievements with progress (or default values for those not yet started)
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
    <Suspense fallback={<div>Cargando logros...</div>}>
      <AchievementsClient 
        initialAchievements={achievementsWithProgress}
        profile={profile}
      />
    </Suspense>
  );
}