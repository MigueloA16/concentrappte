// src/components/achievements/RecentAchievements.tsx
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, Clock, Target } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

// Icons and Utilities
import { iconMap } from '@/lib/achievement-icons';
import { cn } from '@/lib/utils';

// Types
import { AchievementWithProgress } from '@/lib/supabase/database.types';

// Component Interface
interface RecentAchievementsProps {
  achievements: AchievementWithProgress[];
  isLoading?: boolean;
}

export default function RecentAchievements({
  achievements,
  isLoading = false
}: RecentAchievementsProps) {
  // Memoized Calculations
  const achievementStats = useMemo(() => {
    // Total count of available achievements
    const totalAchievements = achievements.length;

    // Count of unlocked achievements
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Find the next achievements to unlock (not unlocked but with progress)
    const inProgressAchievements = achievements
      .filter(a => !a.unlocked && a.progress > 0)
      .sort((a, b) => {
        const aPercentage = (a.progress / a.requirement_value) * 100;
        const bPercentage = (b.progress / b.requirement_value) * 100;
        return bPercentage - aPercentage;
      })
      .slice(0, 3);

    // Most recently unlocked achievements
    const recentUnlocked = achievements
      .filter(a => a.unlocked && a.unlocked_at)
      .sort((a, b) => {
        const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
        const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);

    // Get achievement categories counts
    const categoryStats = {
      daily: achievements.filter(a => a.category === 'daily' && a.unlocked).length,
      streak: achievements.filter(a => a.category === 'streak' && a.unlocked).length,
      total: achievements.filter(a => a.category === 'total' && a.unlocked).length,
      technique: achievements.filter(a => a.category === 'technique' && a.unlocked).length
    };

    return {
      totalAchievements,
      unlockedCount,
      inProgressAchievements,
      recentUnlocked,
      categoryStats,
      hasUnlocked: recentUnlocked.length > 0,
      hasInProgress: inProgressAchievements.length > 0
    };
  }, [achievements]);

  // Format time elapsed since achievement unlock
  const formatTimeElapsed = (timestamp: string): string => {
    if (!timestamp) return '';

    const unlockDate = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    if (diffInDays < 30) return `hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `hace ${Math.floor(diffInDays / 30)} meses`;
    return `hace ${Math.floor(diffInDays / 365)} años`;
  };

  // Get requirement type label
  const getRequirementTypeLabel = (type: string): string => {
    switch (type) {
      case 'daily_sessions': return 'sesiones diarias';
      case 'total_sessions': return 'sesiones totales';
      case 'streak_sessions': return 'racha de días';
      case 'technique_pomodoro': return 'sesiones Pomodoro';
      case 'technique_90_20': return 'sesiones 90/20';
      case 'technique_52_17': return 'sesiones 52/17';
      default: return type;
    }
  };

  // Render Loading State
  if (isLoading) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800 flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Logros</CardTitle>
              <div className="text-gray-400 mt-2">
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render Empty State
  if (!achievementStats.hasUnlocked && !achievementStats.hasInProgress) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white">Logros</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Has desbloqueado {achievementStats.unlockedCount} de {achievementStats.totalAchievements} logros
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">
            Comienza a usar la aplicación para desbloquear logros
          </p>
          <Link href="/achievements">
            <Button variant="outline" className="border-gray-700">
              Ver todos los logros
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Render Achievements View
  return (
    <Card className="bg-[#1a1a2e] border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Logros</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Has desbloqueado {achievementStats.unlockedCount} de {achievementStats.totalAchievements} logros
            </CardDescription>
          </div>
          <Link href="achievements">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category progress badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-[#262638] border-gray-700 text-gray-300">
            <Target className="h-3 w-3 mr-1 text-purple-400" />
            Diarios: {achievementStats.categoryStats.daily}
          </Badge>
          <Badge variant="outline" className="bg-[#262638] border-gray-700 text-gray-300">
            <Target className="h-3 w-3 mr-1 text-blue-400" />
            Rachas: {achievementStats.categoryStats.streak}
          </Badge>
          <Badge variant="outline" className="bg-[#262638] border-gray-700 text-gray-300">
            <Target className="h-3 w-3 mr-1 text-green-400" />
            Totales: {achievementStats.categoryStats.total}
          </Badge>
          <Badge variant="outline" className="bg-[#262638] border-gray-700 text-gray-300">
            <Target className="h-3 w-3 mr-1 text-orange-400" />
            Técnicas: {achievementStats.categoryStats.technique}
          </Badge>
        </div>

        <div className="space-y-5">
          {/* Recently unlocked achievements section */}
          {achievementStats.hasUnlocked && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Recién desbloqueados</h3>
              <div className="space-y-3">
                {achievementStats.recentUnlocked.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;

                  return (
                    <TooltipProvider key={achievement.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 p-2 rounded-md bg-[#262638] cursor-pointer">
                            <div className="bg-purple-900/40 text-purple-300 p-2 rounded-full">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="text-white font-medium">{achievement.name}</p>
                                <div className="flex items-center text-xs text-purple-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTimeElapsed(achievement.unlocked_at || '')}
                                </div>
                              </div>
                              <p className="text-gray-400 text-sm">{achievement.description}</p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#262638] border-gray-700 text-white w-64">
                          <p className="text-sm mb-1">{achievement.description}</p>
                          <p className="text-xs text-gray-400">
                            Requisito: {achievement.requirement_value} {getRequirementTypeLabel(achievement.requirement_type)}
                          </p>
                          {achievement.unlocked_at && (
                            <p className="text-xs text-purple-300 mt-1">
                              Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-progress achievements section */}
          {achievementStats.hasInProgress && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Próximos logros</h3>
              <div className="space-y-3">
                {achievementStats.inProgressAchievements.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;
                  const progressPercentage = Math.round((achievement.progress / achievement.requirement_value) * 100);

                  return (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-md bg-[#262638]">
                      <div className="bg-gray-800/80 text-gray-400 p-2 rounded-full">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-gray-300 font-medium">{achievement.name}</p>
                          <span className="text-xs text-gray-500">{progressPercentage}%</span>
                        </div>
                        <p className="text-gray-400 text-sm">{achievement.description}</p>
                        <p className="text-gray-500 text-xs mt-1">Progreso: {achievement.progress}/{achievement.requirement_value}</p>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View all button for mobile */}
        <div className="mt-4 mb-12 md:hidden">
          <Link href="/achievements">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Ver todos los logros
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}