// src/components/achievements/AchievementsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementWithProgress } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { iconMap } from "@/lib/achievement-icons";

interface AchievementsClientProps {
  initialAchievements: AchievementWithProgress[];
  profile: any;
}

export default function AchievementsClient({ 
  initialAchievements,
  profile
}: AchievementsClientProps) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(initialAchievements);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);

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

  // Function to refresh achievements from the server
  const refreshAchievements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // First, get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*");

      if (achievementsError) throw achievementsError;

      // Then get user's achievements progress
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievement_id (id)
        `)
        .eq("user_id", user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Create a map of user's achievements progress
      const userProgressMap = new Map();
      userAchievements.forEach(ua => {
        userProgressMap.set(ua.achievement_id, {
          progress: ua.progress,
          unlocked: ua.unlocked,
          unlocked_at: ua.unlocked_at
        });
      });

      // Combine all achievements with user progress
      const formattedAchievements = allAchievements.map(achievement => ({
        ...achievement,
        progress: userProgressMap.get(achievement.id)?.progress || 0,
        unlocked: userProgressMap.get(achievement.id)?.unlocked || false,
        unlocked_at: userProgressMap.get(achievement.id)?.unlocked_at || null
      }));

      setAchievements(formattedAchievements);
    } catch (error) {
      console.error("Error refreshing achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for achievement updates
  useEffect(() => {
    const achievementsChannel = supabase
      .channel('achievement-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${profile?.id}`
        },
        () => {
          refreshAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(achievementsChannel);
    };
  }, [profile?.id]);

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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a2e] border border-gray-800 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="daily">Diarios</TabsTrigger>
          <TabsTrigger value="streak">Rachas</TabsTrigger>
          <TabsTrigger value="total">Acumulados</TabsTrigger>
          <TabsTrigger value="technique">Técnicas</TabsTrigger>
        </TabsList>

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
                  {categoryAchievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </div>
            )
          ))}
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streak" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="total" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="technique" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for individual achievement cards
function AchievementCard({ achievement }: { achievement: AchievementWithProgress }) {
  // Get the appropriate icon based on the icon name
  const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || iconMap.Trophy;
  
  // Format unlocked date if available
  const formattedDate = achievement.unlocked_at 
    ? format(new Date(achievement.unlocked_at), 'dd/MM/yyyy', { locale: es })
    : null;

  // Calculate progress percentage
  const progressPercentage = Math.min(
    100, 
    Math.round((achievement.progress / achievement.requirement_value) * 100)
  );

  return (
    <Card className={cn(
      "bg-[#1a1a2e] border-gray-800 transition-all duration-300",
      achievement.unlocked ? "border-purple-600/40" : "opacity-75"
    )}>
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
                    {formattedDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Desbloqueado el {formattedDate}
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

          {achievement.unlocked && formattedDate && (
            <p className="text-xs text-gray-500 mt-1">
              Desbloqueado el {formattedDate}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}