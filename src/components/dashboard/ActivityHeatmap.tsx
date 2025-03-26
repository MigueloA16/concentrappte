// src/components/dashboard/ActivityHeatmap.tsx
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Calendar, Trophy } from "lucide-react";

// Function to get activity intensity color
const getActivityIntensity = (minutes: number) => {
  if (minutes === 0) return 'bg-[#101018]';
  if (minutes < 15) return 'bg-green-900/30';
  if (minutes < 30) return 'bg-green-800/50';
  if (minutes < 60) return 'bg-green-700/70';
  return 'bg-green-600';
};

// Format minutes to hours and minutes display
const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h:${mins}m`;
};

type DailyActivity = {
  date: string;
  total_minutes: number;
  sessions_count: number;
};

interface ActivityHeatmapProps {
  activityData: DailyActivity[];
}

export function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  return (
    <Card className="bg-[#1a1a2e] border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-400" />
          Historial de Actividad
        </CardTitle>
        <CardDescription className="text-gray-400">
          Tu tiempo de enfoque durante el año
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="py-2">
            <div className="grid grid-cols-52 gap-[2px]">
              {activityData.map((day, index) => {
                const intensity = getActivityIntensity(day.total_minutes);
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className={`${intensity} w-3 h-3 rounded-sm cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#262638] border-gray-700 text-white">
                      <div className="text-xs">
                        <div className="font-medium">{format(parseISO(day.date), 'PP', { locale: es })}</div>
                        {day.total_minutes > 0 ? (
                          <>
                            <div className="text-gray-300">{formatMinutes(day.total_minutes)} de enfoque</div>
                            <div className="text-gray-300">{day.sessions_count} sesiones</div>
                          </>
                        ) : (
                          <div className="text-gray-300">No hay actividad</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            
            <div className="flex justify-end items-center mt-2 space-x-1 text-xs text-gray-500">
              <span>Menos</span>
              <div className="bg-[#101018] w-2 h-2 rounded-sm"></div>
              <div className="bg-green-900/30 w-2 h-2 rounded-sm"></div>
              <div className="bg-green-800/50 w-2 h-2 rounded-sm"></div>
              <div className="bg-green-700/70 w-2 h-2 rounded-sm"></div>
              <div className="bg-green-600 w-2 h-2 rounded-sm"></div>
              <span>Más</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}