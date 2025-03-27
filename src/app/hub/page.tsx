// src/app/hub/page.tsx
import { Suspense } from "react";
import { getUserProfile } from "@/app/auth-check";
import { createClient } from "@/lib/supabase/server";
import HubPageClient from "@/components/hub/HubPageClient";

export const dynamic = 'force-dynamic';

export default async function HubPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  // Get user's timer settings
  const { data: timerSettings } = await supabase
    .from("timer_settings")
    .select("*, technique:technique_id(name, description)")
    .eq("user_id", profile?.id || '')
    .single();

  // Get today's focus sessions
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

  // Get recent tasks - ensure we filter out deleted tasks
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", profile?.id || '')
    .eq("deleted", false)  // Make sure deleted tasks are filtered out
    .order("created_at", { ascending: false });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HubPageClient
        initialTimerSettings={timerSettings}
        initialRecentTasks={recentTasks || []}
        initialRecentSessions={todaySessions || []}
        initialProfile={profile}
      />
    </Suspense>
  );
}