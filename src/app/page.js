"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { logout } from "../../utils/handleLogout";
import LoadingScreen from "./LoadingPage";

// --- SVG Icon Components (tidak ada perubahan) ---
const FilmIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

const MusicIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
);

const ArrowRightIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const LogoutIcon = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);




export default function Home() {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Tampilan kosong selagi proses redirect
  }
  
  return (
    <main className="min-h-screen w-full bg-gray-900 text-gray-200 font-sans relative">
      {/* Background Gradient Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
        
        {/* Header Section with User Info */}
        <header className="flex flex-col sm:flex-row justify-between items-center w-full mb-10 sm:mb-16 gap-4">
            <div className="flex items-center gap-4">
                <img 
                    src={user?.photoURL || "https://i.pinimg.com/736x/f7/5c/b4/f75cb4ad9e644fa76c199b94c7c5877e.jpg"} 
                    alt="Foto profil pengguna" 
                    className="w-14 h-14 rounded-full border-2 border-slate-600 object-cover" 
                />
                <div>
                    <h2 className="text-xl font-bold text-white">Hello, {user?.displayName || 'Pengguna'}!</h2>
                    <h2 className="text-xs font-medium text-white opacity-80">{user?.email || 'email'}</h2>
                    {/* TODO: Ambil data role dari Firestore/Database karena tidak tersedia di object auth standar */}
                    <span className="text-sm font-medium bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full inline-block mt-1">
                        Administrator
                    </span>
                </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-300 bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg"
            >
                <LogoutIcon className="w-5 h-5" />
                <span>Logout</span>
            </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-grow text-center">
             <h1 className="font-poppins text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-4">
              Selamat Datang di Admin Panel
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-12">
              Pilih aplikasi yang ingin Anda kelola dari dasbor.
            </p>

            {/* Card Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* HiyoriNime Card (Disabled) */}
              <div 
                className="relative bg-slate-900/70 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-lg flex flex-col items-center transition-all duration-300 cursor-not-allowed group"
              >
                 <span className="absolute top-4 right-4 bg-yellow-400/80 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
                <div className="bg-slate-800 p-4 rounded-full mb-6 border border-slate-700">
                    <FilmIcon className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">HiyoriNime</h2>
                <p className="text-slate-400 mt-2">Kelola konten anime</p>
              </div>

              {/* ReMusic Card (Active) */}
              <a
                href="/remusic"
                className="relative bg-slate-900/70 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-lg flex flex-col items-center transition-all duration-300 group hover:border-indigo-500 hover:shadow-indigo-500/20 hover:-translate-y-2"
              >
                <div className="bg-slate-800 p-4 rounded-full mb-6 border border-slate-700 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-500">
                    <MusicIcon className="w-10 h-10 text-indigo-400 transition-colors duration-300 group-hover:text-indigo-300" />
                </div>
                <h2 className="text-2xl font-semibold text-white">ReMusic</h2>
                <p className="text-slate-400 mt-2">Kelola koleksi musik</p>
                 <ArrowRightIcon className="absolute bottom-8 right-8 w-6 h-6 text-slate-500 opacity-0 transform -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
              </a>
            </div>
        </div>
        
        <footer className="text-center mt-16 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} ReMusic. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}

