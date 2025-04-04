"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, Github, Loader2 } from "lucide-react";
import Link from "next/link";

type AuthFormProps = {
  view: "sign-in" | "sign-up";
};

export default function AuthForm({ view }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for auth errors on mount (from OAuth redirects)
  useEffect(() => {
    const checkForErrors = async () => {
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        toast.error(errorDescription || `Error de autenticación: ${error}`);
        setAuthError(errorDescription || `Error de autenticación: ${error}`);
      }

      // Check if we have a session already
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // We're logged in, redirect to hub
        router.push('/hub');
      }
    };

    checkForErrors();
  }, [router]);

  const getURL = () => {
    const url = window.location.origin; // This is more reliable than env vars

    // Don't add trailing slash as we'll add specific paths
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (view === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split("@")[0],
            },
            emailRedirectTo: `${getURL()}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        toast.success("Registro exitoso! Por favor revisa tu email para verificar tu cuenta.");
        router.push("/auth/verify");
      } else {
        // First attempt to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Handle specific error cases with more user-friendly messages
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("El correo o la contraseña no son correctos. Por favor intenta nuevamente.");
          }
          throw signInError;
        }

        toast.success("¡Ingresaste exitosamente!");

        // Force a refresh to ensure profile is created
        try {
          const response = await fetch('/api/auth/refresh-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            console.warn('Profile refresh failed, but login successful');
          }
        } catch (refreshError) {
          console.warn('Error refreshing profile, but login successful:', refreshError);
          // Don't block login if profile refresh fails
        }

        router.push("/hub");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error durante la autenticación";
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setOauthLoading(provider);
      setAuthError(null);

      // Set up the OAuth sign-in
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getURL()}/auth/callback`,
          // This helps ensure we capture all available profile information
          scopes: provider === 'google' ? 'profile email' : undefined,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      if (error) {
        throw error;
      }

      // If we get here, the OAuth redirect is happening
      // No need to do anything as the browser will be redirected
    } catch (error: any) {
      console.error("OAuth error:", error);
      const errorMessage = error instanceof Error ? error.message : "Autenticación fallida";
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left side with content and form */}
      <div className="flex-1 lg:w-[45%] flex flex-col items-center justify-center p-4 bg-[#0f0f1a]">
        <Link href="/" className="flex items-center mb-8">
          <Clock className="h-6 w-6 mr-2 text-purple-400" />
          <span className="text-xl font-bold text-white">ConcentrAPPte</span>
        </Link>

        <Card className="w-full max-w-md bg-[#1a1a2e] border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-white text-xl">{view === "sign-in" ? "Bienvenido" : "Create una cuenta"}</CardTitle>
            <CardDescription className="text-gray-400">
              {view === "sign-in"
                ? "Ingresa para continuar con tus sesiones de enfoque"
                : "Crea tu cuenta para empezar tus sesiones de enfoque"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Display authentication errors */}
            {authError && (
              <div className="p-3 rounded-md bg-red-900/20 border border-red-800 text-red-300 text-sm">
                {authError}
              </div>
            )}

            {/* Social login buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-[#262638]"
                onClick={() => handleOAuthSignIn('github')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                {view === "sign-in"
                  ? "Ingresa"
                  : "Regístrate"} con GitHub
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-[#262638]"
                onClick={() => handleOAuthSignIn('google')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                {view === "sign-in"
                  ? "Ingresa"
                  : "Regístrate"} con Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1a1a2e] px-2 text-gray-400">O continúa con tu email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "sign-up" && (
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-300">
                    Apodo
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Contraseña
                  </label>
                  {view === "sign-in" && (
                    <Link href="/auth/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Cargando...
                  </>
                ) : view === "sign-in" ? (
                  "Ingresar"
                ) : (
                  "Crea tu cuenta"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <div className="text-sm text-center w-full text-gray-400">
              {view === "sign-in" ? (
                <p>
                  ¿No tienes una cuenta?{" "}
                  <Link href="/auth/sign-up" className="text-purple-400 hover:underline">
                    Regístrate
                  </Link>
                </p>
              ) : (
                <p>
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/auth/sign-in" className="text-purple-400 hover:underline">
                    Ingresa
                  </Link>
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right side with promotional content */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-purple-950/80 via-purple-950/70 to-black/80 items-center justify-center p-8">
        <div className="max-w-md space-y-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Cada minuto cuenta,<br />
            Todo enfoque lo vale
          </h2>
          <p className="text-purple-200">
            Únete a miles de personas enfocadas en su éxito que utilizan nuestro temporizador para aumentar la productividad y lograr más con menos estrés.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-purple-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">15+</div>
              <div className="text-purple-200 text-sm">Horas de concentración semanales</div>
            </div>
            <div className="bg-purple-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">89%</div>
              <div className="text-purple-200 text-sm">Ven resultandos en 14 días</div>
            </div>
            <div className="bg-purple-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">3x</div>
              <div className="text-purple-200 text-sm">Veces mejor en grupos de estudio</div>
            </div>
            <div className="bg-purple-800/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white mt-3">$9.99</div>
              <div className="text-purple-200 text-sm">Único Pago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}