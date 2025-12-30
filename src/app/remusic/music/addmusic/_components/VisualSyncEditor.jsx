import React, { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronsRight, Music } from 'lucide-react';
import { formatTimestamp } from '../_utils/uploadHelpers';

export default function VisualSyncEditor({
    title, selectedArtist, newArtistName, isCreatingArtist, coverPreviewUrl,
    audioPreviewUrl, isPlaying, setIsPlaying, currentTime, setCurrentTime,
    parsedLyrics, syncIndex, setSyncIndex, activeLyricIndex, setActiveLyricIndex,
    handleTapSync, skipTime,
    theme, isDarkMode
}) {
    const audioRef = useRef(null);
    const activeLyricRef = useRef(null);
    const syncTargetRef = useRef(null);

    // Sync Scroll Effect
    useEffect(() => {
        if (isPlaying && activeLyricRef.current) {
            activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } else if (!isPlaying && syncTargetRef.current) {
            syncTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }, [activeLyricIndex, syncIndex, isPlaying]);

    // Update Time Effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateTime = () => {
            const time = audio.currentTime;
            setCurrentTime(time);
            const index = parsedLyrics.findIndex((line, i) => {
                const nextLine = parsedLyrics[i + 1];
                return time >= line.time && (!nextLine || time < nextLine.time);
            });
            setActiveLyricIndex(index);
        };
        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, [parsedLyrics, audioPreviewUrl, setCurrentTime, setActiveLyricIndex]);

    // Auto-advance Sync Index Logic (Copied from EditSongModal)
    useEffect(() => {
        if (activeLyricIndex >= 0 && activeLyricIndex < parsedLyrics.length) {
            const nextLine = Math.min(activeLyricIndex + 1, parsedLyrics.length - 1);
            if (isPlaying) {
                setSyncIndex(nextLine);
            }
        } else if (activeLyricIndex === -1 && isPlaying) {
            setSyncIndex(0);
        }
    }, [activeLyricIndex, isPlaying, parsedLyrics.length, setSyncIndex]);

    const playLine = (timestamp, index) => {
        if (audioRef.current) {
            audioRef.current.currentTime = timestamp;
            audioRef.current.play();
            setIsPlaying(true);
            setSyncIndex(index);
        }
    };

    return (
        <div className={`w-full lg:w-[65%] flex flex-col ${isDarkMode ? 'bg-[#050b1d]' : 'bg-slate-100/50'} relative flex-1 min-h-0 h-full`}>
            {/* Header Player */}
            <div className={`px-4 md:px-8 py-4 border-b ${theme.border} flex flex-col gap-4 ${theme.bg} shrink-0 z-10 shadow-sm`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`w-12 h-12 rounded-xl shrink-0 ${theme.cardBg} flex items-center justify-center border ${theme.border} overflow-hidden relative group`}>
                            {coverPreviewUrl ? <img src={coverPreviewUrl} className="w-full h-full object-cover" /> : <Music size={20} className="opacity-30" />}
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold truncate leading-tight">{title || "Untitled Song"}</div>
                            <div className={`text-xs ${theme.textMuted} truncate mt-0.5 flex items-center gap-1`}>
                                {isCreatingArtist ? <span className="text-emerald-400">{newArtistName || "New Artist"}</span> : selectedArtist?.name || "Unknown Artist"}
                            </div>
                        </div>
                    </div>
                    <div className={`font-mono text-2xl font-bold tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {formatTimestamp(currentTime)}
                    </div>
                </div>

                {/* Audio Controls */}
                {audioPreviewUrl && (
                    <div className="flex gap-3 items-center bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                        <audio ref={audioRef} src={audioPreviewUrl} className="hidden"
                            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}
                        />
                        <button onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <div className="h-8 w-px bg-slate-700 mx-1"></div>
                        <button onClick={() => skipTime(audioRef, 5)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${theme.hover} ${theme.textMuted}`}>
                            <RotateCcw size={14} /> -5s
                        </button>
                    </div>
                )}
            </div>

            {/* Lyrics List */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-3 relative ${theme.scrollHide}`}>
                {parsedLyrics.map((line, idx) => {
                    const isTarget = idx === syncIndex;
                    const isActive = idx === activeLyricIndex;
                    return (
                        <div
                            key={idx}
                            ref={isActive ? activeLyricRef : (isTarget ? syncTargetRef : null)}
                            onClick={() => setSyncIndex(idx)}
                            className={`relative group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border-2 ${isTarget ? `${theme.targetRow} scale-[1.02] z-10` : isActive ? `${theme.activeRow} opacity-90` : `border-transparent ${theme.hover} opacity-50`}`}
                        >
                            <button onClick={(e) => { e.stopPropagation(); playLine(line.time, idx); }} className={`p-2 rounded-xl shrink-0 transition-colors ${isTarget || isActive ? 'bg-indigo-500 text-white' : `bg-slate-700/20 ${theme.textMuted}`}`}>
                                <Play size={14} fill="currentColor" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm md:text-lg font-medium leading-snug ${isTarget ? theme.text : theme.textMuted}`}>
                                    {line.text || <span className="italic opacity-30 font-light">Instrumental / Break</span>}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div className="h-32"></div>
            </div>

            {/* Sync Button */}
            <div className={`p-4 md:p-6 border-t ${theme.border} ${theme.bg} shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]`}>
                <div className="max-w-3xl mx-auto flex items-stretch gap-4">
                    <div className={`hidden md:flex flex-1 flex-col justify-center px-6 rounded-2xl border ${theme.border} ${theme.cardBg} relative overflow-hidden`}>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Up Next</span>
                        <p className={`text-base font-bold truncate ${theme.text} opacity-80`}>{parsedLyrics[syncIndex] ? parsedLyrics[syncIndex].text || "..." : "End of Lyrics"}</p>
                    </div>
                    <button
                        onClick={handleTapSync}
                        disabled={!audioPreviewUrl || syncIndex >= parsedLyrics.length}
                        className={`flex-1 md:flex-none md:w-64 py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 ${(!audioPreviewUrl || syncIndex >= parsedLyrics.length) ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
                    >
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] opacity-80 font-medium tracking-wide">TAP HERE</span>
                            <span className="text-xl leading-none">SYNC LINE</span>
                        </div>
                        <ChevronsRight size={28} className={syncIndex < parsedLyrics.length ? "animate-pulse" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
}