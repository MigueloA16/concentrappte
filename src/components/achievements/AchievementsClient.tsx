// src/components/achievements/AchievementsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, LockIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Import types directly from database.types
import {
  AchievementWithProgress,
  ProfileWithLevel
} from "@/lib/supabase/database.types";

// Import icon map from a centralized location
import { iconMap } from "@/lib/achievement-icons";

interface AchievementsClientProps {
  initialAchievements: AchievementWithProgress[];
  profile: ProfileWithLevel;
}

export default function AchievementsClient({
  initialAchievements,
  profile
}: AchievementsClientProps) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(initialAchievements);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // When initial data is loaded, stop showing the initial loading state
  useEffect(() => {
    if (initialAchievements.length > 0) {
      setInitialLoading(false);
    }
  }, [initialAchievements]);

  // Count unlocked achievements
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  // Filter achievements based on the active tab
  const filteredAchievements = activeTab === "all"
    ? achievements
    : achievements.filter(a => a.category === activeTab);

  // Group achievements by category for better display
  const achievementsByCategory = {
    daily: achievements.filter(a => a.category === "daily"),
    streak: achievements.filter(a => a.category === "streak"),
    total: achievements.filter(a => a.category === "total"),
    technique: achievements.filter(a => a.category === "technique"),
  };

  // Render achievement card
  const renderAchievementCard = (achievement: AchievementWithProgress) => {
    const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;
    const progressPercentage = Math.min(
      100,
      Math.round((achievement.progress / achievement.requirement_value) * 100)
    );

    return (
      <Card
        key={achievement.id}
        className={cn(
          "bg-[#1a1a2e] border-gray-800 transition-all duration-300",
          achievement.unlocked ? "border-purple-600/40" : "opacity-75"
        )}
      >
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className={cn(
                "flex items-center justify-center rounded-full p-3",
                achievement.unlocked
                  ? "bg-purple-900/40 text-purple-300"
                  : "bg-gray-800/50 text-gray-400"
              )}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-lg",
                  achievement.unlocked ? "text-white" : "text-gray-400"
                )}>
                  {achievement.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {achievement.description}
                </CardDescription>
              </div>
            </div>

            {!achievement.unlocked && (
              <div className="text-gray-600">
                <LockIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          {achievement.unlocked && (
            <Badge
              className="absolute top-3 right-6 bg-purple-600 hover:bg-purple-700"
            >
              Desbloqueado
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  achievement.unlocked ? "text-purple-400" : "text-gray-500"
                )}>
                  Progreso: {achievement.progress}/{achievement.requirement_value}
                </span>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#262638] border-gray-700 text-white">
                      <p>{achievement.description}</p>
                      {achievement.unlocked && achievement.unlocked_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-gray-500">{progressPercentage}%</span>
            </div>

            <Progress
              value={progressPercentage}
              className={cn(
                "h-2",
                achievement.unlocked
                  ? "bg-gray-700"
                  : "bg-gray-800"
              )}
            />

            {achievement.unlocked && achievement.unlocked_at && (
              <p className="text-xs text-gray-500 mt-1">
                Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Logros</h1>
        <p className="text-gray-400">Desbloquea logros a medida que utilizas la aplicación y mejoras tu productividad</p>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <Card className="bg-[#1a1a2e] border-gray-800 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Logros Desbloqueados</CardTitle>
              <CardDescription className="text-gray-400 mt-1">Tu progreso total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">{unlockedCount} de {totalCount}</span>
                  <span className="text-purple-400 text-sm">{Math.round((unlockedCount / totalCount) * 100)}%</span>
                </div>
                <Progress
                  value={(unlockedCount / totalCount) * 100}
                  className="h-2 bg-gray-700"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Racha Actual</CardTitle>
              <CardDescription className="text-gray-400 mt-1">Días consecutivos de enfoque</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">{profile?.streak_days || 0} días</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Tiempo Total</CardTitle>
              <CardDescription className="text-gray-400 mt-1">Tiempo de enfoque acumulado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">
                {Math.floor((profile?.total_focus_time || 0) / 60)} hrs {(profile?.total_focus_time || 0) % 60} mins
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1a2e] border border-gray-800 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="daily">Diarios</TabsTrigger>
          <TabsTrigger value="streak">Rachas</TabsTrigger>
          <TabsTrigger value="total">Acumulados</TabsTrigger>
          <TabsTrigger value="technique">Técnicas</TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex justify-center items-center my-8">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin mr-2" />
            <span className="text-gray-300">Actualizando logros...</span>
          </div>
        )}

        <TabsContent value="all" className="space-y-6">
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            categoryAchievements.length > 0 && (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-bold text-white capitalize">
                  {category === "daily" && "Logros Diarios"}
                  {category === "streak" && "Logros de Racha"}
                  {category === "total" && "Logros Acumulados"}
                  {category === "technique" && "Logros de Técnica"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map(renderAchievementCard)}
                </div>
              </div>
            )
          ))}
        </TabsContent>

        {["daily", "streak", "total", "technique"].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.length > 0 ? (
                filteredAchievements.map(renderAchievementCard)
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-400">
                  No hay logros en esta categoría
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}