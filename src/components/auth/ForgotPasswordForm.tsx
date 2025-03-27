"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success("Se ha enviado un enlace de recuperación a tu correo");
      setSubmitted(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error al enviar el correo de recuperación";
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
          <CardTitle className="text-white text-xl">Recuperar contraseña</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa tu correo electrónico para recibir un enlace de recuperación
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitted ? (
            <div className="p-3 rounded-md bg-purple-900/20 border border-purple-800 text-purple-300 text-sm">
              Se ha enviado un correo a {email}. Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <div className="text-sm text-center w-full text-gray-400">
            <p>
              <Link href="/auth/sign-in" className="text-purple-400 hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}