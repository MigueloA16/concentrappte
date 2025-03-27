"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a hash fragment in the URL (from Supabase password reset)
  useEffect(() => {
    const handlePasswordReset = async () => {
      // Supabase automatically exchanges the token when the page loads
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        toast.error("El enlace de recuperación no es válido o ha expirado.");
        router.push("/auth/forgot-password");
      }
    };

    handlePasswordReset();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Contraseña actualizada correctamente");
      
      // Redirect to sign in
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
      
    } catch (error: any) {
      console.error("Password update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error al actualizar tu contraseña";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Link href="/" className="flex items-center mb-8">
        <Clock className="h-6 w-6 mr-2 text-purple-400" />
        <span className="text-xl font-bold text-white">ConcentrAPPte</span>
      </Link>

      <Card className="w-full max-w-md bg-[#1a1a2e] border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-white text-xl">Crea una nueva contraseña</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa tu nueva contraseña abajo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-900/20 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Nueva contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}