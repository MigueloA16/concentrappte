"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  BarChart, 
  Users, 
  Settings, 
  Play,
  Trophy
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Resumen",
    href: "/dashboard",
    icon: BarChart,
  },
  {
    label: "Concéntrate",
    href: "/hub",
    icon: Clock,
  },
  {
    label: "Logros",
    href: "/achievements",
    icon: Trophy,
  },  
  {
    label: "Grupos de Estudio",
    href: "/rooms",
    icon: Users,
  },
  {
    label: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle window resize and check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Desktop sidebar
  if (!isMobile) {
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
      </aside>
    );
  }

  // Mobile navigation
  return (
    <>
      {/* Mobile top navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-800 bg-[#1a1a2e] shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`flex flex-col items-center justify-center h-14 px-0 ${
                    isActive 
                      ? "bg-purple-900/50 text-purple-200" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive ? "text-purple-400" : ""}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Focus Session Button (Fixed to bottom right) */}
      <div className="md:hidden fixed bottom-24 right-4 z-30">
        <Button 
          className="rounded-full h-14 w-14 shadow-xl bg-purple-600 hover:bg-purple-700 p-0" 
          size="icon"
          onClick={() => window.location.href = '/hub'}
        >
          <Play className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}