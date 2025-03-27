// src/components/achievements/RecentAchievements.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { iconMap } from "@/lib/achievement-icons";
import { AchievementWithProgress } from "@/lib/supabase/database.types";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentAchievementsProps {
  achievements: AchievementWithProgress[];
  isLoading?: boolean;
}

export default function RecentAchievements({ achievements, isLoading = false }: RecentAchievementsProps) {
  // Get the total count of available achievements
  const totalAchievements = achievements.length;

  // Count how many achievements have been unlocked
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Find the next achievements to unlock (those not unlocked but with progress > 0)
  const inProgressAchievements = achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => {
      // Sort by percentage completion (higher first)
      const aPercentage = (a.progress / a.requirement_value) * 100;
      const bPercentage = (b.progress / b.requirement_value) * 100;
      return bPercentage - aPercentage;
    })
    .slice(0, 3);

  // Get the most recently unlocked achievements (max 3)
  const recentUnlocked = achievements
    .filter(a => a.unlocked && a.unlocked_at)
    .sort((a, b) => {
      const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
      const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  // Determine what to display based on unlocked and in-progress achievements
  const hasUnlocked = recentUnlocked.length > 0;
  const hasInProgress = inProgressAchievements.length > 0;

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Logros</CardTitle>
              {/* Fixed: Don't put Skeleton inside CardDescription */}
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

  if (!hasUnlocked && !hasInProgress) {
    // No unlocked or in-progress achievements
    return (
      <Card className="bg-[#1a1a2e] border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white">Logros</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Has desbloqueado {unlockedCount} de {totalAchievements} logros
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

  return (
    <Card className="bg-[#1a1a2e] border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Logros</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Has desbloqueado {unlockedCount} de {totalAchievements} logros
            </CardDescription>
          </div>
          <Link href="/achievements">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Recently unlocked achievements section */}
          {hasUnlocked && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Recién desbloqueados</h3>
              <div className="space-y-3">
                {recentUnlocked.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;

                  return (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-md bg-[#262638]">
                      <div className="bg-purple-900/40 text-purple-300 p-2 rounded-full">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{achievement.name}</p>
                        <p className="text-gray-400 text-sm">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-progress achievements section */}
          {hasInProgress && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Próximos logros</h3>
              <div className="space-y-3">
                {inProgressAchievements.map((achievement) => {
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