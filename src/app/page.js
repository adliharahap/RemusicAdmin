"use client";

import React, { useState, useEffect } from "react";
import { 
  Music, 
  Film, 
  LogOut, 
  ArrowRight, 
  LayoutGrid, 
  Lock, 
  Sparkles,
  Command,
  Loader2
} from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";

// --- Mock Loading Component ---
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B0C15] text-indigo-500">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);

// --- Sub-Component: Dashboard Card ---
const DashboardCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  status = "active", 
  accentColor 
}) => {
  const isLocked = status === "coming-soon";
  
  // Base classes
  const containerClasses = `
    relative overflow-hidden group p-1 rounded-3xl transition-all duration-500
    ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20'}
  `;

  // Gradient Border Effect
  const gradientClasses = `
    absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-500 group-hover:opacity-100
    ${accentColor === 'purple' ? 'from-purple-600 via-fuchsia-500 to-indigo-500' : 'from-indigo-500 via-blue-500 to-cyan-500'}
  `;

  return (
    <div className={containerClasses}>
      {/* Background Gradient Border */}
      <div className={gradientClasses} />
      
      {/* Card Content */}
      <Link 
        href={isLocked ? '#' : href}
        onClick={(e) => isLocked && e.preventDefault()}
        className="relative block h-full bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-8 border border-white/5 overflow-hidden"
      >
        {/* Decorative Background Blob */}
        <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-${accentColor}-500`} />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 text-${accentColor}-400 group-hover:text-white group-hover:bg-${accentColor}-500 transition-all duration-300`}>
                <Icon size={32} strokeWidth={1.5} />
              </div>
              {isLocked ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium uppercase tracking-wider">
                  <Lock size={12} /> Coming Soon
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
              {title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {!isLocked && (
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-white/50 group-hover:text-white transition-colors">
              Launch Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default function Home() {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Tampilan kosong selagi proses redirect
  }
  

  if (loading) {
    return <LoadingScreen />;
  }

  // If logged out (null user), show a simple re-login button for demo purposes
  if (!user) {
    return (
        <div className="min-h-screen w-full bg-[#0B0C15] flex flex-col items-center justify-center text-slate-200">
            <h2 className="text-2xl font-bold mb-4">Logged Out</h2>
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors"
            >
                Login Again
            </button>
        </div>
    ); 
  }  

  return (
    <main className="min-h-screen w-full bg-[#0B0C15] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* --- Background Grid Pattern --- */}
      <div className="absolute inset-0 z-0 opacity-20" 
        style={{
          backgroundImage: `linear-gradient(#2d2d3a 1px, transparent 1px), linear-gradient(to right, #2d2d3a 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0B0C15] via-transparent to-transparent h-full w-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col min-h-screen">
        
        {/* --- Header / Navbar --- */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Command className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">ReMusic<span className="text-slate-500">Panel</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-md p-1.5 pr-2 rounded-full border border-white/10">
            <div className="flex items-center gap-3 pl-2">
               <img 
                  src={user?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 object-cover" 
              />
              <div className="hidden sm:block text-left mr-2">
                <p className="text-xs font-semibold text-white">{user?.displayName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>
            <button 
              className="p-2 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all duration-200 group"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* --- Hero Section --- */}
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2 animate-fade-in-up">
            <Sparkles size={12} />
            <span>Welcome back, {user?.displayName}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight max-w-4xl mx-auto">
            Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Digital Empire</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Select an application below to access its control panel. Monitor metrics, manage content, and configure settings.
          </p>
        </div>

        {/* --- Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-auto">
          
          {/* ReMusic Card */}
          <DashboardCard 
            title="ReMusic Manager"
            description="Manage songs, albums, artists, and curate playlists for the music platform."
            icon={Music}
            href="/remusic"
            status="active"
            accentColor="indigo"
          />

          {/* HiyoriNime Card */}
          <DashboardCard 
            title="HiyoriNime"
            description="Anime content database. Upload episodes, manage series metadata, and servers."
            icon={Film}
            href="#"
            status="coming-soon"
            accentColor="purple"
          />
        </div>

        {/* --- Footer --- */}
        <footer className="mt-16 py-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
              <LayoutGrid size={14} />
              &copy; {new Date().getFullYear()} ReMusic Ecosystem. Designed for efficiency.
            </p>
        </footer>

      </div>
    </main>
  );
}
