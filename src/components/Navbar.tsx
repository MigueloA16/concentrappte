"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock, LogOut } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database['public']['Tables']['profiles']['Row'];

type NavbarProps = {
  user: Profile | null;
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="border-b border-gray-800 bg-[#0f0f1a]">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <Clock className="h-6 w-6 mr-2 text-purple-400" />
            <span className="text-xl font-bold text-white">ConcentrAPPte</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="border border-gray-800">
              <AvatarImage src={user?.avatar_url || ""} alt={user?.username || "User"} />
              <AvatarFallback className="bg-purple-800 text-white">{getInitials(user?.username)}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block font-medium text-white">
              {user?.username || "User"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}