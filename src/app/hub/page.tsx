// src/app/hub/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";
import HubPageClient from "@/components/hub/HubPageClient";

// Import types directly from database.types
import {
  ProfileWithLevel,
  FocusSession,
  Task,
  TimerSetting
} from "@/lib/supabase/database.types";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

async function fetchTimerSettings(userId: string): Promise<TimerSetting | null> {
  const supabase = await createClient();

  const { data: timerSettings, error } = await supabase
    .from("timer_settings")
    .select("*, technique:technique_id(name, description)")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching timer settings:", error);
    return null;
  }

  return timerSettings as TimerSetting;
}

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

async function fetchAllTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return tasks as Task[];
}

export default async function HubPage() {
  // Get user profile and check authentication
  const profile = await getUserProfile();

  if (!profile) {
    // Redirect or handle unauthenticated user
    return <div>Unauthorized</div>;
  }

  // Fetch data in parallel for better performance
  const [
    timerSettings,
    todaySessions,
    allTasks
  ] = await Promise.all([
    fetchTimerSettings(profile.id),
    fetchTodaySessions(profile.id),
    fetchAllTasks(profile.id)
  ]);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <HubPageClient
        initialTimerSettings={timerSettings}
        initialAllTasks={allTasks}
        initialTodaySessions={todaySessions}
        initialProfile={profile as ProfileWithLevel}
      />
    </Suspense>
  );
}