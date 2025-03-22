"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  BarChart, 
  Users, 
  Settings, 
  Play 
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart,
  },
  {
    label: "Timer",
    href: "/dashboard/timer",
    icon: Clock,
  },
  {
    label: "Study Rooms",
    href: "/dashboard/rooms",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-gray-800 w-16 md:w-56 h-full flex flex-col bg-[#1a1a2e]">
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                passHref
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`justify-start h-10 w-full ${
                    isActive 
                      ? "bg-purple-900/50 text-purple-200 hover:bg-purple-900/70" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-2 ${isActive ? "text-purple-400" : ""}`} />
                  <span className="hidden md:inline-block">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4">
        <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
          <Play className="h-4 w-4 mr-2" />
          <span className="hidden md:inline-block">Start Focus</span>
        </Button>
      </div>
    </aside>
  );
}