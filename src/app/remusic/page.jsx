"use client";
import React, { useState, useEffect } from "react";
import { Users, Music, Mic2, Disc, ArrowUpRight, ArrowRight, Bell, Shield, Loader2, PlaySquare } from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({
    users: 0,
    songs: 0,
    artists: 0,
    playlists: 0
  });

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Total Counts (Parallel)
      const [
        { count: usersCount },
        { count: songsCount },
        { count: artistsCount },
        { count: playlistsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('playlists').select('*', { count: 'exact', head: true })
      ]);

      setStatsData({
        users: usersCount || 0,
        songs: songsCount || 0,
        artists: artistsCount || 0,
        playlists: playlistsCount || 0
      });

      // 2. Fetch Recent Activities 
      // Ambil 3 user terbaru
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Ambil 2 lagu terbaru
      const { data: recentSongs } = await supabase
        .from('songs')
        .select('id, title, artist, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      // Gabung dan Sort berdasarkan waktu
      const combined = [
        ...(recentUsers || []).map(u => ({
          id: `u_${u.id}`,
          user: u.display_name,
          action: "Mendaftar sebagai pengguna baru",
          target: "Aplikasi Remusic",
          timestamp: new Date(u.created_at).getTime(),
          timeText: new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        })),
        ...(recentSongs || []).map(s => ({
          id: `s_${s.id}`,
          user: "Admin",
          action: "Menambahkan lagu baru",
          target: `${s.title} - ${s.artist}`,
          timestamp: new Date(s.created_at).getTime(),
          timeText: new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }))
      ];

      const sortedActivities = combined.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      setActivities(sortedActivities);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { name: "Total Pengguna", value: statsData.users.toLocaleString('id-ID'), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Total Lagu", value: statsData.songs.toLocaleString('id-ID'), icon: Music, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Total Artis", value: statsData.artists.toLocaleString('id-ID'), icon: Mic2, color: "text-pink-500", bg: "bg-pink-500/10" },
    { name: "Total Playlist", value: statsData.playlists.toLocaleString('id-ID'), icon: Disc, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Admin</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Pantau statistik dan aktivitas terbaru platform Remusic.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-500 dark:text-gray-400 text-sm font-medium">{stat.name}</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h2>
            {/* Omitted view all for now */}
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/30 hover:border-slate-200 dark:hover:border-slate-600/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-white font-bold uppercase">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate">
                      <span className="font-bold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">{activity.target}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-4">{activity.timeText}</span>
              </div>
            )) : !isLoading && (
              <div className="text-center py-8 text-slate-500">
                Tidak ada aktivitas baru akhir-akhir ini.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link href="/remusic/addmusic" className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
              <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Tambah Lagu</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Unggah musik baru ke server</p>
              </div>
            </Link>

            <Link href="/remusic/user" className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Kelola Pengguna</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Moderasi dan suspend user</p>
              </div>
            </Link>

            <Link href="/remusic/notifications" className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Broadcast Notifikasi</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Kirim info pemeliharaan server</p>
              </div>
            </Link>

            <Link href="/remusic/system-health" className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
              <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Kesehatan Sistem</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Cek status link telegram bot</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

