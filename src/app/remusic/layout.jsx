"use client";
import React, { useEffect, useState } from "react";
import SidebarContent from "./sidebarContent";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import LoadingScreen from "../LoadingPage";

const HomeIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const MusicNoteIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
const MicIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const UserIcon  = ({className}) => <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" className={className}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 7C9.65685 7 11 5.65685 11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7Z"></path> <path d="M14 12C14 10.3431 12.6569 9 11 9H5C3.34315 9 2 10.3431 2 12V15H14V12Z"></path> </g></svg>
const PlaylistIcon = ({ className }) => <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" className={className}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 7V19C21 20.1046 20.1046 21 19 21H7M9 8.5V11.5L12 10L9 8.5ZM17 15V5C17 3.89543 16.1046 3 15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15Z"  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>

const navigation = [
    { name: 'Dashboard', href: '/remusic', icon: HomeIcon, },
    { name: 'User', href: '/remusic/user', icon: UserIcon, },
    { name: 'Musik', href: '/remusic/music', icon: MusicNoteIcon, },
    { name: 'Artis', href: '/remusic/artist', icon: MicIcon,},
    { name: 'Playlist', href: '/remusic/playlist', icon: PlaylistIcon,},
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
    <div className="min-h-screen bg-slate-800">
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
        <main className="py-10 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
