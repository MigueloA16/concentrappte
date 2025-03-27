// src/app/achievements/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import AchievementsClient from "@/components/achievements/AchievementsClient";

// Import types directly from database.types
import {
  ProfileWithLevel,
  Achievement,
  AchievementWithProgress,
  UserAchievement
} from "@/lib/supabase/database.types";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

async function fetchAllAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();

  const { data: achievements, error } = await supabase
    .from("achievements")
    .select("*");

  if (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }

  return achievements;
}

async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = await createClient();

  const { data: userAchievements, error } = await supabase
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

  if (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }

  return userAchievements;
}

async function combineAchievementsWithProgress(
  achievements: Achievement[],
  userAchievements: UserAchievement[]
): Promise<AchievementWithProgress[]> {
  // Create a map of user's achievements
  const userAchievementsMap = new Map();
  userAchievements.forEach(ua => {
    userAchievementsMap.set(ua.achievement_id, {
      progress: ua.progress,
      unlocked: ua.unlocked,
      unlocked_at: ua.unlocked_at
    });
  });

  // Combine achievements with user progress
  return achievements.map(achievement => {
    const userProgress = userAchievementsMap.get(achievement.id);

    return {
      ...achievement,
      progress: userProgress?.progress || 0,
      unlocked: userProgress?.unlocked || false,
      unlocked_at: userProgress?.unlocked_at || null
    };
  });
}

export default async function AchievementsPage() {
  // Get user profile and check authentication
  const profile = await getUserProfile();

  if (!profile) {
    // Redirect or handle unauthenticated user
    return <div>Unauthorized</div>;
  }

  // Fetch data in parallel for better performance
  const [
    allAchievements,
    userAchievements
  ] = await Promise.all([
    fetchAllAchievements(),
    fetchUserAchievements(profile.id)
  ]);

  // Combine achievements with user progress
  const achievementsWithProgress = await combineAchievementsWithProgress(
    allAchievements,
    userAchievements
  );

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AchievementsClient
        initialAchievements={achievementsWithProgress}
        profile={profile as ProfileWithLevel}
      />
    </Suspense>
  );
}