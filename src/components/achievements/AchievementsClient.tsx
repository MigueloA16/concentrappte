// src/components/achievements/AchievementsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, LockIcon, Loader2, Clock, Medal } from "lucide-react";
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
      setAchievements(initialAchievements);
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

  // Get achievement requirement type label
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

  // Format time elapsed since achievement unlock
  const formatTimeElapsed = (timestamp: string): string => {
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

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'daily': return 'bg-purple-900/40 text-purple-300';
      case 'streak': return 'bg-blue-900/40 text-blue-300';
      case 'total': return 'bg-green-900/40 text-green-300';
      case 'technique': return 'bg-orange-900/40 text-orange-300';
      default: return 'bg-gray-800/50 text-gray-400';
    }
  };

  // Get category badge color
  const getCategoryBadgeColor = (category: string): string => {
    switch (category) {
      case 'daily': return 'bg-purple-700/20 text-purple-300 border-purple-600/30';
      case 'streak': return 'bg-blue-700/20 text-blue-300 border-blue-600/30';
      case 'total': return 'bg-green-700/20 text-green-300 border-green-600/30';
      case 'technique': return 'bg-orange-700/20 text-orange-300 border-orange-600/30';
      default: return 'bg-gray-800/50 text-gray-400 border-gray-700';
    }
  };

  // Get progress bar color
  const getProgressBarColor = (category: string, unlocked: boolean): string => {
    if (!unlocked) return 'bg-gray-700';

    switch (category) {
      case 'daily': return 'bg-purple-600';
      case 'streak': return 'bg-blue-600';
      case 'total': return 'bg-green-600';
      case 'technique': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  // Render achievement card
  const renderAchievementCard = (achievement: AchievementWithProgress) => {
    const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;
    const progressPercentage = Math.min(
      100,
      Math.round((achievement.progress / achievement.requirement_value) * 100)
    );
    const categoryColor = getCategoryColor(achievement.category);
    const progressBarColor = getProgressBarColor(achievement.category, achievement.unlocked);

    return (
      <Card
        key={achievement.id}
        className={cn(
          "bg-[#1a1a2e] border-gray-800 transition-all duration-300 hover:bg-[#222236]",
          achievement.unlocked
            ? `border-${achievement.category === 'daily' ? 'purple' : achievement.category === 'streak' ? 'blue' : achievement.category === 'total' ? 'green' : 'orange'}-600/40`
            : "opacity-75"
        )}
      >
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className={cn(
                "flex items-center justify-center rounded-full p-3",
                achievement.unlocked
                  ? categoryColor
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

            {!achievement.unlocked ? (
              <div className="text-gray-600">
                <LockIcon className="h-5 w-5" />
              </div>
            ) : (
              <Badge
                variant="outline"
                className={getCategoryBadgeColor(achievement.category)}
              >
                <Medal className="h-3 w-3 mr-1" />
                {achievement.category === 'daily' ? 'Diario' :
                  achievement.category === 'streak' ? 'Racha' :
                    achievement.category === 'total' ? 'Total' : 'Técnica'}
              </Badge>
            )}
          </div>
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
                      <p className="mb-1">{achievement.description}</p>
                      <p className="text-xs text-gray-400">
                        Requisito: {achievement.requirement_value} {getRequirementTypeLabel(achievement.requirement_type)}
                      </p>
                      {achievement.unlocked && achievement.unlocked_at && (
                        <div className="flex items-center mt-2 text-xs text-purple-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Desbloqueado {formatTimeElapsed(achievement.unlocked_at)}
                        </div>
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
            >
              <div
                className={cn("h-full rounded-full", progressBarColor)}
                style={{ width: `${progressPercentage}%` }}
              />
            </Progress>

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

  // Simplified helper functions for achievement rendering

  // Category Stats 
  const categoryCounts = {
    daily: achievements.filter(a => a.category === 'daily' && a.unlocked).length,
    streak: achievements.filter(a => a.category === 'streak' && a.unlocked).length,
    total: achievements.filter(a => a.category === 'total' && a.unlocked).length,
    technique: achievements.filter(a => a.category === 'technique' && a.unlocked).length
  };

  // Calculate category percentages
  const categoryPercentages = {
    daily: Math.round((categoryCounts.daily / achievementsByCategory.daily.length) * 100) || 0,
    streak: Math.round((categoryCounts.streak / achievementsByCategory.streak.length) * 100) || 0,
    total: Math.round((categoryCounts.total / achievementsByCategory.total.length) * 100) || 0,
    technique: Math.round((categoryCounts.technique / achievementsByCategory.technique.length) * 100) || 0
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Logros</h1>
        <p className="text-gray-400">Desbloquea logros a medida que utilizas la aplicación y mejoras tu productividad</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Achievement progress card - left half */}
          <Card className="bg-[#1a1a2e] border-gray-800">
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
                <Progress value={(unlockedCount / totalCount) * 100} className="h-2 bg-gray-700">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${Math.round((unlockedCount / totalCount) * 100)}%` }}
                  />
                </Progress>
              </div>
            </CardContent>
          </Card>

          {/* Category stats card - right half */}
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardContent className="p-4 space-y-4">
              {/* Diarios */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-purple-700/30 text-purple-300 px-2 py-0.5 text-xs font-medium rounded mr-2">
                      {categoryCounts.daily}/{achievementsByCategory.daily.length}
                    </div>
                    <h3 className="text-purple-300 text-lg font-medium">Diarios</h3>
                  </div>
                  <span className="text-purple-300 text-sm font-medium">{categoryPercentages.daily}%</span>
                </div>
                <Progress value={categoryPercentages.daily} className="h-2 bg-gray-800">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${categoryPercentages.daily}%` }} />
                </Progress>
              </div>

              {/* Rachas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-blue-700/30 text-blue-300 px-2 py-0.5 text-xs font-medium rounded mr-2">
                      {categoryCounts.streak}/{achievementsByCategory.streak.length}
                    </div>
                    <h3 className="text-blue-300 text-lg font-medium">Rachas</h3>
                  </div>
                  <span className="text-blue-300 text-sm font-medium">{categoryPercentages.streak}%</span>
                </div>
                <Progress value={categoryPercentages.streak} className="h-2 bg-gray-800">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${categoryPercentages.streak}%` }} />
                </Progress>
              </div>

              {/* Totales */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-green-700/30 text-green-300 px-2 py-0.5 text-xs font-medium rounded mr-2">
                      {categoryCounts.total}/{achievementsByCategory.total.length}
                    </div>
                    <h3 className="text-green-300 text-lg font-medium">Totales</h3>
                  </div>
                  <span className="text-green-300 text-sm font-medium">{categoryPercentages.total}%</span>
                </div>
                <Progress value={categoryPercentages.total} className="h-2 bg-gray-800">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: `${categoryPercentages.total}%` }} />
                </Progress>
              </div>

              {/* Técnicas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-orange-700/30 text-orange-300 px-2 py-0.5 text-xs font-medium rounded mr-2">
                      {categoryCounts.technique}/{achievementsByCategory.technique.length}
                    </div>
                    <h3 className="text-orange-300 text-lg font-medium">Técnicas</h3>
                  </div>
                  <span className="text-orange-300 text-sm font-medium">{categoryPercentages.technique}%</span>
                </div>
                <Progress value={categoryPercentages.technique} className="h-2 bg-gray-800">
                  <div className="h-full bg-orange-600 rounded-full" style={{ width: `${categoryPercentages.technique}%` }} />
                </Progress>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pb-20 md:pb-0">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1a2e] border border-gray-800 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-800/20">Todos</TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-purple-800/20 data-[state=active]:text-purple-300">Diarios</TabsTrigger>
            <TabsTrigger value="streak" className="data-[state=active]:bg-blue-800/20 data-[state=active]:text-blue-300">Rachas</TabsTrigger>
            <TabsTrigger value="total" className="data-[state=active]:bg-green-800/20 data-[state=active]:text-green-300">Acumulados</TabsTrigger>
            <TabsTrigger value="technique" className="data-[state=active]:bg-orange-800/20 data-[state=active]:text-orange-300">Técnicas</TabsTrigger>
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
                  <h2 className="text-xl font-bold text-white capitalize flex items-center">
                    {category === "daily" && (
                      <>
                        <Badge className="bg-purple-700/20 border-purple-600/30 text-purple-300 mr-2">
                          {categoryCounts.daily}/{achievementsByCategory.daily.length}
                        </Badge>
                        Logros Diarios
                      </>
                    )}
                    {category === "streak" && (
                      <>
                        <Badge className="bg-blue-700/20 border-blue-600/30 text-blue-300 mr-2">
                          {categoryCounts.streak}/{achievementsByCategory.streak.length}
                        </Badge>
                        Logros de Racha
                      </>
                    )}
                    {category === "total" && (
                      <>
                        <Badge className="bg-green-700/20 border-green-600/30 text-green-300 mr-2">
                          {categoryCounts.total}/{achievementsByCategory.total.length}
                        </Badge>
                        Logros Acumulados
                      </>
                    )}
                    {category === "technique" && (
                      <>
                        <Badge className="bg-orange-700/20 border-orange-600/30 text-orange-300 mr-2">
                          {categoryCounts.technique}/{achievementsByCategory.technique.length}
                        </Badge>
                        Logros de Técnica
                      </>
                    )}
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
    </div>
  );
}