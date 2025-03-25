import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { getUserProfile } from "@/app/auth-check";

export default async function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  
  return (
    <div className="flex h-screen flex-col bg-[#0f0f1a] text-white">
      <Navbar user={profile} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 max-w-full">{children}</main>
      </div>
    </div>
  );
}