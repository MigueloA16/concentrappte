import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return user
}

export async function getUserProfile() {
  const user = await requireUser()
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // If the profile exists but doesn't have best_streak, daily_motivation, 
  // target_hours, or level_name, set default values
  if (profile) {
    if (profile.best_streak === null || profile.best_streak === undefined) {
      // Initialize best_streak with current streak value
      await supabase
        .from('profiles')
        .update({ 
          best_streak: profile.streak_days || 0,
          // Set defaults for other new fields if they're missing
          daily_motivation: profile.daily_motivation || "Focus on the process, not just the outcome",
          target_hours: profile.target_hours || 100,
          level_name: profile.level_name || "Bronce"
        })
        .eq('id', user.id)
      
      // Refresh the profile with updated fields
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      return updatedProfile
    }
  }
  
  return profile
}