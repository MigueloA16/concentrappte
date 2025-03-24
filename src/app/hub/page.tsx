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

  // Get recent focus sessions - order by end_time now
  const { data: recentSessions } = await supabase
    .from("focus_sessions")
    .select("*, task:task_id(name)")
    .eq("user_id", profile?.id || '')
    .order("end_time", { ascending: false })  // Order by end_time instead of start_time
    .limit(5);
    
  // Get recent tasks
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", profile?.id || '')
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HubPageClient 
        initialTimerSettings={timerSettings} 
        initialRecentTasks={recentTasks || []} 
        initialRecentSessions={recentSessions || []}
        initialProfile={profile}
      />
    </Suspense>
  );
}