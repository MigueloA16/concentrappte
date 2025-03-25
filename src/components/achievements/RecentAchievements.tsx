// src/components/achievements/RecentAchievements.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { iconMap } from "@/lib/achievement-icons";
import { AchievementWithProgress } from "@/lib/supabase/database.types";

interface RecentAchievementsProps {
  achievements: AchievementWithProgress[];
}

export default function RecentAchievements({ achievements }: RecentAchievementsProps) {
  // Get the most recently unlocked achievements (max 3)
  const recentUnlocked = achievements
    .filter(a => a.unlocked && a.unlocked_at)
    .sort((a, b) => {
      const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
      const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  if (recentUnlocked.length === 0) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white">Logros Recientes</CardTitle>
          <CardDescription className="text-gray-400">
            Desbloquea logros usando la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">
            Aún no has desbloqueado ningún logro
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
            <CardTitle className="text-white">Logros Recientes</CardTitle>
            <CardDescription className="text-gray-400">
              Tus últimos logros desbloqueados
            </CardDescription>
          </div>
          <Link href="/dashboard/achievements">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}