"use client";
import React from "react";
import { ExternalLink, Download, Music, Video, FileText } from "lucide-react";

const tools = [
    {
        title: "Spotify Song Downloader",
        description: "Download your favorite songs from Spotify easily.",
        url: "https://spotidownloader.com/id14",
        icon: Music,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        title: "Spotify Canvas Downloader",
        description: "Download Spotify Canvas videos in high quality.",
        url: "https://www.canvasdownloader.com/",
        icon: Video,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        title: "Lyricsify",
        description: "Search and find lyrics for any song.",
        url: "https://www.lyricsify.com/",
        icon: FileText,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
    },
];

export default function TutorialPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    Tutorial & Tools
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Useful tools for managing and downloading music content.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${tool.bgColor} ${tool.color}`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>

                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            {tool.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            {tool.description}
                        </p>

                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors gap-2"
                        >
                            Visit Website
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
