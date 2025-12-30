"use client";
import React from "react";
import { Users, Music, Mic2, Disc, ArrowUpRight, ArrowRight, Play, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Mock data for stats
  const stats = [
    { name: "Total Users", value: "12,345", change: "+12%", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Total Songs", value: "8,234", change: "+5.4%", icon: Music, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Total Artists", value: "1,432", change: "+3.2%", icon: Mic2, color: "text-pink-500", bg: "bg-pink-500/10" },
    { name: "Active Playlists", value: "4,567", change: "+8.1%", icon: Disc, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  // Mock data for recent activity
  const recentActivity = [
    { id: 1, user: "Sarah Wilson", action: "Created a new playlist", target: "Summer Vibes", time: "2 mins ago" },
    { id: 2, user: "Mike Johnson", action: "Uploaded a new track", target: "Midnight Rain", time: "15 mins ago" },
    { id: 3, user: "Alex Chen", action: "Registered as artist", target: "DJ Alex", time: "1 hour ago" },
    { id: 4, user: "Emily Davis", action: "Reported a song", target: "Broken Link", time: "3 hours ago" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                {stat.change}
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-400 text-sm font-medium">{stat.name}</h3>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.target}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/remusic/music" className="flex items-center gap-3 w-full p-3 bg-slate-800/50 hover:bg-slate-800 text-left rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all group">
              <div className="bg-purple-500/10 p-2 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Music className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Manage Music</p>
                <p className="text-xs text-gray-400">Add or edit tracks</p>
              </div>
            </Link>

            <Link href="/remusic/user" className="flex items-center gap-3 w-full p-3 bg-slate-800/50 hover:bg-slate-800 text-left rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all group">
              <div className="bg-blue-500/10 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Manage Users</p>
                <p className="text-xs text-gray-400">View user details</p>
              </div>
            </Link>

            <Link href="/remusic/playlist" className="flex items-center gap-3 w-full p-3 bg-slate-800/50 hover:bg-slate-800 text-left rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all group">
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Disc className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Playlists</p>
                <p className="text-xs text-gray-400">Curate collections</p>
              </div>
            </Link>

            <button className="flex items-center gap-3 w-full p-3 bg-slate-800/50 hover:bg-slate-800 text-left rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all group">
              <div className="bg-pink-500/10 p-2 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                <Plus className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">New Campaign</p>
                <p className="text-xs text-gray-400">Start promotion</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

