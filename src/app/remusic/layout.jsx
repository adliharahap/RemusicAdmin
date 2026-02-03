"use client";
import React, { useEffect, useState } from "react";
import SidebarContent from "./sidebarContent";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import LoadingScreen from "../LoadingPage";
import { Album, GitPullRequestCreateArrowIcon, HomeIcon, Mic2Icon, MicIcon, Music, Send, UserIcon, Activity, BookOpen, Github } from "lucide-react";


const navigation = [
  { name: 'Dashboard', href: '/remusic', icon: HomeIcon, },
  { name: 'User', href: '/remusic/user', icon: UserIcon, },
  { name: 'Musik', href: '/remusic/music', icon: Music, },
  { name: 'Artis', href: '/remusic/artist', icon: MicIcon, },
  { name: 'Playlist', href: '/remusic/playlist', icon: Album, },
  { name: 'Song Request By User', href: '/remusic/songrequest', icon: GitPullRequestCreateArrowIcon, },
  { name: 'Send Notification To User', href: '/remusic/sendnotification', icon: Send, },
  { name: 'System Health', href: '/remusic/system-health', icon: Activity },
  { name: 'GitHub Upload', href: '/remusic/github-upload', icon: Github },
  { name: 'Tutorial & Tools', href: '/remusic/tutorial', icon: BookOpen },
];



// --- SVG Icon Components ---
const MenuIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useSelector((state) => state.auth);
  const pathname = usePathname();

  const activeNav = navigation.find(item => item.href === pathname);
  const activeName = activeNav ? activeNav.name : "";

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Tampilan kosong selagi proses redirect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#081028] transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-gray-900/80 lg:hidden transition-opacity duration-300 ease-linear ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-xs transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent onClose={() => setSidebarOpen(false)} user={user} navigation={navigation} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent user={user} navigation={navigation} />
      </div>

      <div className="lg:pl-72">
        {/* Mobile Topbar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-white/10 bg-slate-900 px-4 lg:hidden">
          <button className="p-2.5 text-gray-400" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex-1 text-lg font-semibold text-white">{activeName}</div>
        </div>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
