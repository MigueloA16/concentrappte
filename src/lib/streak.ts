// src/lib/streak.ts
import { supabase } from "@/lib/supabase/client";

/**
 * Updates user streak information when they log in
 * This will call the same RPC function used in the FocusTimer component,
 * but with 0 minutes to just update the streak without adding focus time
 */
export async function updateDailyStreak() {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Call RPC with 0 minutes to just update the streak state without adding focus time
    const { error } = await supabase.rpc("increment_focus_time", {
      minutes_to_add: 0
    });

    if (error) {
      console.error("Error updating daily streak:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating daily streak:", error);
    return false;
  }
}

/**
 * Check if streak was already updated today to avoid duplicate calls
 */
export function shouldUpdateStreak(): boolean {
  const lastStreakUpdate = localStorage.getItem('lastStreakUpdate');
  const today = new Date().toDateString();
  
  return lastStreakUpdate !== today;
}

/**
 * Mark streak as updated for today
 */
export function markStreakUpdated(): void {
  const today = new Date().toDateString();
  localStorage.setItem('lastStreakUpdate', today);
}