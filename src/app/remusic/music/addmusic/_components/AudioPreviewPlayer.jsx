import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

export default function AudioPreviewPlayer({ theme, audioFile, audioPreviewUrl, telegramFileId, title, selectedArtist, newArtistName, isCreatingArtist, coverPreviewUrl }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Derived states for display
    const displayTitle = title || "Unknown Title";
    const displayArtist = isCreatingArtist ? (newArtistName || "New Artist") : (selectedArtist?.name || "Unknown Artist");
    const hasAudio = !!(audioPreviewUrl || telegramFileId);

    // Audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [audioPreviewUrl]); // Re-bind if url changes

    useEffect(() => {
        if (!hasAudio) {
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
        }
    }, [hasAudio]);

    const togglePlay = () => {
        if (!audioRef.current || !hasAudio) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // For telegramFileId, we'd need an API route to stream it, but for now we assume 
            // the user is uploading a local file if they want to preview it, or we skip preview 
            // for telegram files unless we fetch it.
            if (audioPreviewUrl) {
                audioRef.current.play().catch(e => console.error("Error playing audio:", e));
                setIsPlaying(true);
            } else if (telegramFileId) {
                alert("Preview audio dari Telegram ID belum didukung secara langsung di browser.");
            }
        }
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !hasAudio) return;
        const time = Number(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "0:00";
        const m = Math.floor(timeInSeconds / 60);
        const s = Math.floor(timeInSeconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg} w-full shadow-sm`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                <Music size={14} /> Preview Audio
            </h3>

            {/* Audio Element Hidden */}
            {audioPreviewUrl && (
                <audio ref={audioRef} src={audioPreviewUrl} />
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Cover & Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 shadow-inner relative group border border-slate-700/50">
                        {coverPreviewUrl ? (
                            <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-[#1e293b]">
                                <Music size={24} className="opacity-50" />
                            </div>
                        )}
                        {isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="flex gap-1 items-end h-4">
                                    <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-full"></div>
                                    <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s] h-1/2"></div>
                                    <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.2s] h-3/4"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate w-full" title={displayTitle}>{displayTitle}</h4>
                        <p className={`text-xs truncate opacity-70 w-full`} title={displayArtist}>{displayArtist}</p>
                    </div>
                </div>

                {/* Player Controls */}
                <div className="flex-1 w-full max-w-[300px] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono opacity-60 w-8">{formatTime(currentTime)}</span>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                disabled={!hasAudio}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!hasAudio ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
                                        isPlaying ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-900 hover:scale-105'
                                    }`}
                            >
                                {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                            </button>
                        </div>

                        <span className="text-[10px] font-mono opacity-60 w-8 text-right">{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            disabled={!hasAudio}
                            className={`w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 ${hasAudio ? 'bg-slate-700' : 'bg-slate-800 cursor-not-allowed'
                                }`}
                            style={{
                                background: hasAudio ? `linear-gradient(to right, #818cf8 ${(currentTime / (duration || 1)) * 100}%, #334155 ${(currentTime / (duration || 1)) * 100}%)` : ''
                            }}
                        />
                        <button
                            onClick={toggleMute}
                            disabled={!hasAudio}
                            className={`text-slate-400 hover:text-white transition-colors ${!hasAudio && 'opacity-30 cursor-not-allowed'}`}
                        >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {!hasAudio && (
                <div className="text-[10px] text-center mt-3 text-red-400/80 bg-red-400/10 py-1 rounded-md">
                    Upload Audio File to Preview
                </div>
            )}
        </div>
    );
}
