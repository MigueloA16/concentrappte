"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split("@")[0],
            },
          },
        });

        if (error) {
          throw error;
        }

        toast.success("Sign up successful! Please check your email for verification.");
        router.push("/auth/verify");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        toast.success("Signed in successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Link href="/" className="flex items-center mb-8">
        <Clock className="h-8 w-8 mr-2 text-purple-400" />
        <span className="text-2xl font-bold text-white">FocusTimer</span>
      </Link>
      
      <Card className="w-full max-w-md bg-[#1a1a2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{view === "sign-in" ? "Sign In" : "Sign Up"}</CardTitle>
          <CardDescription className="text-gray-400">
            {view === "sign-in"
              ? "Enter your credentials to access your account"
              : "Create a new account to get started"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {view === "sign-up" && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Username
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
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : view === "sign-in"
                ? "Sign In"
                : "Sign Up"}
            </Button>
            <div className="text-sm text-center mt-4 text-gray-400">
              {view === "sign-in" ? (
                <p>
                  Don't have an account?{" "}
                  <Link href="/auth/sign-up" className="text-purple-400 hover:underline">
                    Sign up
                  </Link>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <Link href="/auth/sign-in" className="text-purple-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}