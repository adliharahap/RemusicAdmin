"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    X, Save, Play, Pause, RefreshCw, User, Music, Clock,
    RotateCcw, PlayCircle, Sun, Moon, Disc, Target, ChevronsRight,
    Copy, Check,
    FileAudio,
    ImageIcon
} from 'lucide-react';
import { useTheme } from 'next-themes';

// --- HELPER: Parse Lirik LRC ---
const parseLrc = (lrcString) => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    return lines.map((line, index) => {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + milliseconds / 1000;
            return { time, text: match[4].trim(), original: line, index };
        }
        return { time: -1, text: line.trim(), original: line, index };
    });
};

// --- HELPER: Format Waktu ---
const formatTimestamp = (currentTime) => {
    if (currentTime < 0) return "--:--";
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const ms = Math.floor((currentTime % 1) * 100);
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
};

export default function EditSongModal({ isOpen, onClose, song, onSuccess }) {
    // --- STATE ---
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

    const [formData, setFormData] = useState({});
    const [playableUrl, setPlayableUrl] = useState("");
    const [isFetchingStream, setIsFetchingStream] = useState(false);

    // Audio State
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [parsedLyrics, setParsedLyrics] = useState([]);

    // Highlight states
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
    const [syncIndex, setSyncIndex] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null); // 'song' | 'artist'

    // Refs
    const activeLyricRef = useRef(null); // Ref untuk playback
    const syncTargetRef = useRef(null);  // Ref untuk cursor sync
    const lyricsContainerRef = useRef(null);

    // --- EFFECT: Init Data ---
    useEffect(() => {
        if (song && isOpen) {
            const dataToUse = {
                id: song.id,
                title: song.title || "",
                artist_id: song.artist_id || "",
                artist_name: song.artists?.name || 'Unknown Artist',
                cover_url: song.cover_url || "",
                canvas_url: song.canvas_url || "",
                audio_url: song.audio_url || "",
                telegram_audio_file_id: song.telegram_audio_file_id || "",
                lyrics: song.lyrics || "",
            };

            setFormData(dataToUse);
            setParsedLyrics(parseLrc(dataToUse.lyrics || ""));
            setSyncIndex(0);

            // Set default playable url
            setPlayableUrl(dataToUse.audio_url);
        }
    }, [song, isOpen]);

    // --- EFFECT: Audio Sync (Playback Highlight) ---
    useEffect(() => {
        if (!isOpen) return;

        const tgId = formData.telegram_audio_file_id;

        // Jika Telegram ID diisi (> 20 karakter), kita request link baru
        if (tgId && tgId.length > 20) {
            const fetchStream = async () => {
                setIsFetchingStream(true);
                try {
                    const res = await fetch(`/api/get-stream-url?file_id=${tgId}`);
                    const data = await res.json();

                    if (data.success && data.url) {
                        setPlayableUrl(data.url);
                    } else {
                        setPlayableUrl(formData.audio_url);
                    }
                } catch (error) {
                    console.error("Stream Error:", error);
                    setPlayableUrl(formData.audio_url);
                } finally {
                    setIsFetchingStream(false);
                }
            };

            const timeoutId = setTimeout(fetchStream, 1000);
            return () => clearTimeout(timeoutId);
        }
        else {
            setPlayableUrl(formData.audio_url);
            setIsFetchingStream(false);
        }

    }, [formData.telegram_audio_file_id, formData.audio_url, isOpen]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            const time = audio.currentTime;
            setCurrentTime(time);

            // Cari lirik aktif (hanya yang punya timestamp valid)
            const index = parsedLyrics.findIndex((line, i) => {
                if (line.time === -1) return false; // Skip baris belum sync

                // Cari baris berikutnya yang punya timestamp valid
                let nextLine = null;
                for (let j = i + 1; j < parsedLyrics.length; j++) {
                    if (parsedLyrics[j].time !== -1) {
                        nextLine = parsedLyrics[j];
                        break;
                    }
                }

                return time >= line.time && (!nextLine || time < nextLine.time);
            });

            if (index !== -1) setActiveLyricIndex(index);
        };

        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, [parsedLyrics]);

    useEffect(() => {
        if (activeLyricIndex >= 0 && activeLyricIndex < parsedLyrics.length) {
            const nextLine = Math.min(activeLyricIndex + 1, parsedLyrics.length - 1);

            if (isPlaying) {
                setSyncIndex(nextLine);
            }
        } else if (activeLyricIndex === -1 && isPlaying) {
            setSyncIndex(0);
        }
    }, [activeLyricIndex, isPlaying, parsedLyrics.length]);

    useEffect(() => {
        if (isPlaying && activeLyricRef.current) {
            activeLyricRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
        // Jika sedang PAUSE, baru boleh scroll ke target sync (biar enak edit manual)
        else if (!isPlaying && syncTargetRef.current) {
            syncTargetRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }, [activeLyricIndex, syncIndex, isPlaying]);

    // --- HANDLERS ---

    const handleCopy = (text, type) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(type);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'lyrics') {
            const newParsed = parseLrc(value);
            setParsedLyrics(newParsed);
            setSyncIndex(0);
        }
    };

    const playLine = (timestamp, index) => {
        if (audioRef.current) {
            audioRef.current.currentTime = timestamp;
            audioRef.current.play();
            setIsPlaying(true);
            setSyncIndex(index);
        }
    };

    const handleTapSync = () => {
        if (!audioRef.current || syncIndex >= parsedLyrics.length) return;

        const newTime = audioRef.current.currentTime;
        const newTimestampString = formatTimestamp(newTime);

        const updatedLyrics = [...parsedLyrics];
        updatedLyrics[syncIndex] = {
            ...updatedLyrics[syncIndex],
            time: newTime,
            original: `${newTimestampString} ${updatedLyrics[syncIndex].text}`
        };

        setParsedLyrics(updatedLyrics);
        const newRawLyrics = updatedLyrics.map(l => l.original).join('\n');
        setFormData(prev => ({ ...prev, lyrics: newRawLyrics }));

        // Maju ke baris berikutnya
        if (syncIndex < parsedLyrics.length - 1) {
            setSyncIndex(prev => prev + 1);
        }
    };

    const setManualSyncTarget = (index) => {
        setSyncIndex(index);
    };

    const skipTime = (seconds) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Simulasi save
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Saving lyrics:", formData.lyrics);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error:", error);
            alert("Gagal update lagu.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !mounted) return null;

    // --- THEME CONFIG ---
    const theme = isDarkMode
        ? {
            bg: 'bg-[#081028]',
            text: 'text-white',
            textMuted: 'text-slate-400',
            border: 'border-slate-800',
            cardBg: 'bg-[#0f172a]',
            inputBg: 'bg-[#1e293b]',
            hover: 'hover:bg-slate-800',
            activeRow: 'bg-indigo-900/40 border-indigo-500/50',
            targetRow: 'border-emerald-500 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
            iconColor: 'text-indigo-400',
            scrollHide: '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        }
        : {
            bg: 'bg-white',
            text: 'text-slate-900',
            textMuted: 'text-slate-500',
            border: 'border-slate-200',
            cardBg: 'bg-slate-50',
            inputBg: 'bg-white',
            hover: 'hover:bg-slate-100',
            activeRow: 'bg-blue-50 border-blue-400',
            targetRow: 'border-emerald-500 bg-emerald-50 shadow-sm',
            iconColor: 'text-blue-600',
            scrollHide: '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 md:p-4 transition-all duration-300">
            <div className={`${theme.bg} ${theme.text} w-full max-w-7xl h-[95dvh] md:h-[95vh] rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col border ${theme.border} overflow-hidden font-sans`}>

                {/* --- HEADER --- */}
                <div className={`flex justify-between items-center px-4 md:px-8 py-3 md:py-5 border-b ${theme.border} shrink-0`}>
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-2 md:p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10' : 'bg-blue-100'} transition-colors`}>
                            <Music className={theme.iconColor} size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold tracking-tight">Lyric Studio</h2>
                            <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-slate-500/10 ${theme.textMuted} font-medium`}>Editor Mode</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Toggle button removed */}
                        <button onClick={onClose} className={`p-2 md:p-3 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors ${theme.textMuted}`}>
                            <X size={22} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    <div className={`w-full lg:w-[35%] flex flex-col border-b lg:border-b-0 lg:border-r ${theme.border} ${theme.scrollHide} overflow-y-auto shrink-0 max-h-[40vh] lg:max-h-full`}>
                        <div className="p-4 md:p-8 space-y-4 md:space-y-6">

                            {/* Player Card */}
                            <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 ${theme.cardBg} border ${theme.border} shadow-sm relative overflow-hidden`}>
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${isDarkMode ? 'bg-indigo-500' : 'bg-blue-500'}`} />
                                <div className="flex items-center gap-3 md:gap-5 mb-4 md:mb-6 relative z-10">
                                    <div className="relative group shrink-0">
                                        <img
                                            src={formData.cover_url || "https://placehold.co/100?text=Disc"}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-lg"
                                        />
                                        <div className={`absolute inset-0 rounded-xl md:rounded-2xl ring-1 ring-inset ${isDarkMode ? 'ring-white/10' : 'ring-black/5'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base md:text-lg truncate leading-tight mb-0.5 md:mb-1">{formData.title || "No Title"}</h3>
                                        <p className={`text-xs md:text-sm ${theme.textMuted} truncate`}>{formData.artist_name}</p>
                                    </div>
                                </div>
                                <audio
                                    ref={audioRef}
                                    src={playableUrl}
                                    className="w-full h-8 mb-4 rounded focus:outline-none"
                                    controls
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />
                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    <button type="button" onClick={() => skipTime(3)} className={`flex items-center justify-center gap-2 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                                        <RotateCcw size={14} /> 3s
                                    </button>
                                    <button type="button" onClick={() => skipTime(5)} className={`flex items-center justify-center gap-2 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                                        <RotateCcw size={14} /> 5s
                                    </button>
                                </div>
                            </div>

                            {/* Metadata Section */}
                            <div className="space-y-3 md:space-y-4">
                                {/* Song ID Box - Simplified for mobile */}
                                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${theme.border} ${theme.inputBg} relative group`}>
                                    <div className="flex items-center justify-between">
                                        <label className={`text-[10px] uppercase font-bold tracking-wider ${theme.textMuted} flex items-center gap-1`}>
                                            <Music size={10} /> Song ID
                                        </label>
                                        <button
                                            onClick={() => handleCopy(formData.id, 'song')}
                                            className={`p-1 rounded transition-all ${copiedId === 'song' ? 'text-emerald-500' : 'text-slate-400'}`}
                                        >
                                            {copiedId === 'song' ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                    <code className="block mt-1 text-xs font-mono text-emerald-400 truncate select-all">
                                        {formData.id || "No ID"}
                                    </code>
                                </div>

                                {/* Artist Info Box - Simplified for mobile */}
                                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${theme.border} ${theme.inputBg}`}>
                                    <label className={`text-[10px] uppercase font-bold tracking-wider ${theme.textMuted} mb-1 md:mb-3 flex items-center gap-1`}>
                                        <User size={10} /> Artist Details
                                    </label>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold ${theme.text} truncate mr-2`}>
                                            {formData.artist_name || "Unknown"}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(formData.artist_id, 'artist')}
                                            className={`flex items-center gap-1 text-[10px] font-mono p-1 rounded ${copiedId === 'artist' ? 'text-emerald-500' : 'text-indigo-400'}`}
                                        >
                                            ID {copiedId === 'artist' ? <Check size={10} /> : <Copy size={10} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Minimal Form */}
                            <form id="song-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                                {/* SECTION 1: AUDIO SOURCE */}
                                <div className={`p-4 rounded-xl border ${theme.border} ${theme.inputBg} space-y-4`}>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} flex items-center gap-2`}>
                                        <FileAudio size={14} /> Audio Source
                                    </h3>

                                    {/* Input Telegram ID */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold opacity-70">Telegram File ID (Prioritas)</label>
                                        <input
                                            type="text"
                                            name="telegram_audio_file_id"
                                            value={formData.telegram_audio_file_id || ""}
                                            onChange={handleInputChange}
                                            placeholder="Paste ID Telegram..."
                                            className={`w-full p-2 text-xs rounded-lg border ${theme.border} bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none font-mono`}
                                        />
                                    </div>

                                    {/* Input Direct URL */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold opacity-70">Direct Audio URL (Fallback)</label>
                                        <input
                                            type="text"
                                            name="audio_url"
                                            value={formData.audio_url || ""}
                                            onChange={handleInputChange}
                                            placeholder="https://..."
                                            className={`w-full p-2 text-xs rounded-lg border ${theme.border} bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none font-mono ${formData.telegram_audio_file_id ? 'opacity-50' : ''}`}
                                        />
                                    </div>
                                </div>

                                {/* SECTION 2: VISUAL ASSETS */}
                                {/* SECTION 2: VISUAL ASSETS */}
                                <div className={`p-4 rounded-xl border ${theme.border} ${theme.inputBg} space-y-4`}>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} flex items-center gap-2`}>
                                        <ImageIcon size={14} /> Visual Assets
                                    </h3>

                                    {/* --- COVER IMAGE INPUT --- */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-semibold opacity-70">Cover Image URL</label>
                                            {formData.cover_url && <span className="text-[9px] text-emerald-500 font-bold">PREVIEW ACTIVE</span>}
                                        </div>

                                        {/* PREVIEW GAMBAR */}
                                        {formData.cover_url && (
                                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-700 relative group">
                                                <img
                                                    src={formData.cover_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => e.target.style.display = 'none'} // Sembunyi jika error
                                                />
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            name="cover_url"
                                            value={formData.cover_url || ""}
                                            onChange={handleInputChange}
                                            className={`w-full p-2 text-xs rounded-lg border ${theme.border} bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none font-mono`}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    {/* --- CANVAS VIDEO INPUT --- */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-semibold opacity-70">Canvas Video URL (mp4)</label>
                                            {formData.canvas_url && <span className="text-[9px] text-emerald-500 font-bold">PREVIEW ACTIVE</span>}
                                        </div>

                                        {/* PREVIEW VIDEO */}
                                        {formData.canvas_url && (
                                            <div className="w-32 rounded-lg overflow-hidden border border-slate-700 bg-black relative">
                                                <video
                                                    src={formData.canvas_url}
                                                    className="w-full h-auto max-h-48 object-contain"
                                                    autoPlay muted loop playsInline
                                                />
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            name="canvas_url"
                                            value={formData.canvas_url || ""}
                                            onChange={handleInputChange}
                                            className={`w-full p-2 text-xs rounded-lg border ${theme.border} bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none font-mono`}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <details className={`group border ${theme.border} rounded-xl overflow-hidden`}>
                                    <summary className={`cursor-pointer p-3 md:p-4 font-semibold text-xs md:text-sm flex justify-between items-center ${theme.cardBg} hover:opacity-80 transition`}>
                                        <span className="flex items-center gap-2"><Disc size={16} /> Edit Raw Text</span>
                                        <span className="transition-transform group-open:rotate-180 opacity-50">▼</span>
                                    </summary>
                                    <textarea
                                        name="lyrics"
                                        className={`w-full h-32 md:h-48 p-3 md:p-4 font-mono text-xs outline-none resize-none leading-relaxed ${theme.inputBg} ${theme.text}`}
                                        value={formData.lyrics || ''}
                                        onChange={handleInputChange}
                                        placeholder="[00:00.00] Lyrics..."
                                        spellCheck={false}
                                    />
                                </details>
                            </form>
                        </div>
                    </div>
                    <div className={`w-full lg:w-[65%] flex flex-col ${isDarkMode ? 'bg-[#050b1d]' : 'bg-slate-100/50'} relative flex-1 min-h-0`}>

                        {/* Status Bar */}
                        <div className={`px-4 md:px-8 py-2 md:py-4 border-b ${theme.border} flex justify-between items-center ${theme.bg} shrink-0 z-10`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className={`text-xs md:text-sm font-semibold ${theme.textMuted}`}>{isPlaying ? 'Playing' : 'Paused'}</span>
                            </div>
                            <div className={`font-mono text-base md:text-xl font-bold tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                {formatTimestamp(currentTime)}
                            </div>
                        </div>

                        {/* Lyrics List Area */}
                        <div
                            ref={lyricsContainerRef}
                            className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-2 md:space-y-3 relative ${theme.scrollHide}`}
                        >
                            {parsedLyrics.length > 0 ? (
                                parsedLyrics.map((line, idx) => {
                                    const isTarget = idx === syncIndex;
                                    const isActive = idx === activeLyricIndex;

                                    return (
                                        <div
                                            key={idx}
                                            ref={isActive ? activeLyricRef : (isTarget ? syncTargetRef : null)}
                                            onClick={() => setManualSyncTarget(idx)}
                                            className={`
                                                relative group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 cursor-pointer border-2
                                                ${isTarget
                                                    ? `${theme.targetRow} scale-[1.01] md:scale-[1.02] z-10`
                                                    : isActive
                                                        ? `${theme.activeRow} opacity-90`
                                                        : `border-transparent ${theme.hover} opacity-60 hover:opacity-100`
                                                }
                                            `}
                                        >
                                            {/* Left Indicator for Target */}
                                            {isTarget && (
                                                <div className="absolute -left-1 md:-left-2 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-8 md:h-12 bg-emerald-500 rounded-r-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            )}

                                            {/* Controls */}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); playLine(line.time, idx); }}
                                                className={`
                                                    p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 shrink-0
                                                    ${isTarget || isActive ? 'bg-indigo-500 text-white shadow-lg' : `bg-slate-700/20 ${theme.textMuted} hover:bg-indigo-500 hover:text-white`}
                                                `}
                                            >
                                                {isActive && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                            </button>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2 mb-0.5 md:mb-1">
                                                    <span className={`font-mono text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded ${isTarget ? 'bg-emerald-500/20 text-emerald-500' : isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                                        {formatTimestamp(line.time)}
                                                    </span>
                                                    {isTarget && <span className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-wider animate-pulse">Next Sync</span>}
                                                </div>
                                                <p className={`text-sm md:text-base lg:text-lg leading-snug break-words font-medium ${isTarget ? theme.text : isActive ? theme.text : theme.textMuted}`}>
                                                    {line.text || <span className="italic opacity-30 font-light">Instrumental / Jeda</span>}
                                                </p>
                                            </div>

                                            {line.time > 0 && <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                                    <Music size={60} strokeWidth={0.5} />
                                    <p className="mt-4 text-sm md:text-lg font-medium">Tempel lirik LRC di panel kiri</p>
                                </div>
                            )}
                            <div className="h-24 md:h-32"></div>
                        </div>

                        {/* --- BIG BOTTOM SYNC BAR --- */}
                        <div className={`p-3 md:p-6 border-t ${theme.border} ${theme.bg} shrink-0 relative z-20`}>
                            <div className="flex items-stretch gap-2 md:gap-4 max-w-4xl mx-auto h-16 md:h-20">
                                <div className={`flex-1 flex flex-col justify-center px-4 md:px-6 rounded-xl md:rounded-2xl border ${theme.border} ${theme.cardBg} overflow-hidden relative`}>
                                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5 md:mb-1">Ready to Sync</span>
                                    <p className={`text-sm md:text-lg font-bold truncate ${theme.text}`}>
                                        {parsedLyrics[syncIndex] ? (
                                            <>
                                                <span className="text-emerald-500 mr-2">#{syncIndex + 1}</span>
                                                {parsedLyrics[syncIndex].text || "..."}
                                            </>
                                        ) : (
                                            "Selesai! Simpan sekarang."
                                        )}
                                    </p>
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-emerald-500/30 transition-all duration-300"
                                        style={{ width: `${(syncIndex / Math.max(1, parsedLyrics.length)) * 100}%` }}
                                    />
                                </div>

                                <button
                                    onClick={handleTapSync}
                                    disabled={syncIndex >= parsedLyrics.length}
                                    className={`
                                        px-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-white shadow-xl flex items-center gap-2 md:gap-3 transition-all active:scale-95 active:shadow-none
                                        ${syncIndex >= parsedLyrics.length
                                            ? 'bg-slate-600 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] md:text-xs opacity-80 font-medium tracking-wide">TAP</span>
                                        <span className="text-sm md:text-xl">SYNC</span>
                                    </div>
                                    <ChevronsRight size={20} className={`md:w-7 md:h-7 ${syncIndex < parsedLyrics.length ? "animate-pulse" : ""}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ACTION --- */}
                <div className={`px-4 md:px-8 py-3 md:py-5 border-t ${theme.border} ${theme.bg} flex justify-between items-center shrink-0`}>
                    <div className="text-xs font-mono opacity-50 hidden md:block">
                        TIP: Klik baris lirik untuk memindahkan kursor sync secara manual.
                    </div>
                    <div className="flex gap-3 ml-auto w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="song-form"
                            disabled={isSaving}
                            className={`
                                flex-1 md:flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/25 
                                transition-all flex items-center justify-center gap-2
                                ${isSaving ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}
                            `}
                        >
                            {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save size={16} /> Simpan</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}