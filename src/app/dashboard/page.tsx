import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/app/auth-check";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const supabase = await createClient();

  const { data: recentSessions } = await supabase
    .from("focus_sessions")
    .select(`
    *,
    task:task_id (id, name)
  `)
    .eq("user_id", profile?.id || '')
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Bienvenido, {profile?.username || 'User'}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Tiempo Total de Enfoque</CardTitle>
            <CardDescription className="text-gray-400">Tu progreso total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">
              {Math.floor((profile?.total_focus_time || 0) / 60)} hrs {(profile?.total_focus_time || 0) % 60} mins
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Racha Actual</CardTitle>
            <CardDescription className="text-gray-400">Días consecutivos de enfoque</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">{profile?.streak_days || 0} días</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Recent Sessions</CardTitle>
            <CardDescription className="text-gray-400">Tus últimas 5 sesiones de enfoque</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <ul className="space-y-2">
                {recentSessions.map((session) => (
                  <li key={session.id} className="text-sm border-l-2 border-purple-600 pl-3 py-1">
                    <span className="font-medium text-white">{session.task?.name || "Sin tarea específica"}</span>
                    <span className="text-gray-400 ml-2">
                      {session.duration_minutes ? `${session.duration_minutes}m` : "En progreso"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No tienes sesiones recientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Reporte Semanal</CardTitle>
            <CardDescription className="text-gray-400">Tu tiempo de enfoque ésta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <p className="text-gray-400">Tu historial de enfoque aparecerá acá a medida que completes sesiones.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}