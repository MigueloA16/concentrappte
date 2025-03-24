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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardClient
        initialProfile={profile}
        initialRecentSessions={recentSessions || []}
      />
    </Suspense>
  );
}