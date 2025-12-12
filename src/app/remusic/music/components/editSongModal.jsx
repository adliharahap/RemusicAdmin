"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Play, Pause, RefreshCw, User, Music, Clock } from 'lucide-react'; // Gunakan Lucide icons agar konsisten
import { supabase } from '../../../../../lib/supabaseClient';

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
            // Konversi ke detik float
            const time = minutes * 60 + seconds + milliseconds / 1000;
            return { time, text: match[4].trim(), original: line, index };
        }
        return { time: -1, text: line, original: line, index }; // Baris tanpa timestamp
    }).filter(l => l.time !== -1); // Filter baris kosong/invalid
};

// --- HELPER: Format Waktu (Detik -> [MM:SS.ms]) ---
const formatTimestamp = (currentTime) => {
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const ms = Math.floor((currentTime % 1) * 100);
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
};


export default function EditSongModal({ isOpen, onClose, song, onSuccess }) {
    console.log(song);
    
    
    // State Form
    const [formData, setFormData] = useState({});
    
    // State Audio & Lyrics
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
    
    const [isSaving, setIsSaving] = useState(false);

    // --- 1. INIT DATA ---
    useEffect(() => {
        if (song) {
            // Gunakan originalData (snake_case) jika ada, atau mapping manual
            const dataToUse = song.originalData || {
                id: song.id,
                title: song.title,
                artist_id: song.artistId,
                artist_name: song.artistName, // Pastikan dikirim dari parent
                cover_url: song.coverUrl,
                audio_url: song.audioUrl,
                play_count: song.playCount,
                lyrics: song.lyrics,
                moods: song.moods
            };
            setFormData(dataToUse);
            setParsedLyrics(parseLrc(dataToUse.lyrics || ""));
        }
    }, [song, isOpen]);

    // --- 2. AUDIO & LYRIC SYNC LOGIC ---
    useEffect(() => {
        if (!audioRef.current) return;

        const updateTime = () => {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);

            // Cari index lirik yang aktif
            const index = parsedLyrics.findIndex((line, i) => {
                const nextLine = parsedLyrics[i + 1];
                return time >= line.time && (!nextLine || time < nextLine.time);
            });
            setActiveLyricIndex(index);
        };

        const audio = audioRef.current;
        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, [parsedLyrics]);

    // Scroll lirik aktif ke tengah
    const activeLyricRef = useRef(null);
    useEffect(() => {
        if (activeLyricRef.current) {
            activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLyricIndex]);


    // --- HANDLERS ---
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Jika lirik diubah manual di textarea, parse ulang
        if (name === 'lyrics') {
            setParsedLyrics(parseLrc(value));
        }
    };

    // Fitur "Paskan Timestamp"
    const syncTimestamp = (index) => {
        if (!audioRef.current) return;
        
        const newTime = audioRef.current.currentTime;
        const newTimestampString = formatTimestamp(newTime);
        
        // Update di state parsedLyrics (untuk UI)
        const updatedParsedLyrics = [...parsedLyrics];
        updatedParsedLyrics[index].time = newTime;
        updatedParsedLyrics[index].original = `${newTimestampString} ${updatedParsedLyrics[index].text}`;
        setParsedLyrics(updatedParsedLyrics);

        // Update di textarea (Raw String) -> Ini yang akan disimpan ke DB
        const newRawLyrics = updatedParsedLyrics.map(l => l.original).join('\n');
        setFormData(prev => ({ ...prev, lyrics: newRawLyrics }));
    };

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('songs')
                .update({
                    title: formData.title,
                    play_count: formData.play_count,
                    cover_url: formData.cover_url,
                    audio_url: formData.audio_url,
                    lyrics: formData.lyrics,
                    // Artist ID & Name tidak diupdate (readonly)
                })
                .eq('id', song.id);

            if (error) throw error;
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Gagal update:", error);
            alert("Gagal update lagu.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-800">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Music className="text-indigo-500" /> Edit Lagu
                        </h2>
                        <p className="text-sm text-gray-500">ID: {song?.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* KOLOM KIRI: FORM & MEDIA */}
                    <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-gray-800 space-y-6">
                        
                        {/* Audio Player */}
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-4 mb-4">
                                <img 
                                    src={formData.cover_url || "https://placehold.co/100?text=No+Cover"} 
                                    className="w-16 h-16 rounded-lg object-cover bg-gray-900" 
                                />
                                <div>
                                    <h3 className="font-bold text-white">{formData.title}</h3>
                                    <p className="text-sm text-gray-400">{formData.artist_name || 'Unknown'}</p>
                                </div>
                            </div>
                            <audio 
                                ref={audioRef} 
                                src={formData.audio_url} 
                                className="w-full" 
                                controls 
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        </div>

                        {/* Metadata Form */}
                        <form id="song-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Judul Lagu</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                    value={formData.title || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Artis (Read-Only)</label>
                                    <div className="relative mt-1">
                                        <User className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3 pl-10 text-gray-400 cursor-not-allowed"
                                            value={formData.artist_name || ''}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Artist ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-gray-400 cursor-not-allowed mt-1 font-mono text-xs"
                                        value={formData.artist_id || ''}
                                        readOnly
                                        disabled
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Play Count</label>
                                <input 
                                    type="number" 
                                    name="play_count" 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                    value={formData.play_count || 0}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Raw Lyrics Editor (Hidden/Optional or Small) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Edit Lirik Manual (Raw)</label>
                                <textarea 
                                    name="lyrics"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none mt-1 h-32"
                                    value={formData.lyrics || ''}
                                    onChange={handleInputChange}
                                    placeholder="[00:00.00] Lirik..."
                                />
                            </div>
                        </form>
                    </div>

                    {/* KOLOM KANAN: LYRICS SYNC EDITOR */}
                    <div className="w-full lg:w-1/2 flex flex-col bg-gray-950">
                        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Clock size={18} className="text-green-500" /> Sync Editor
                            </h3>
                            <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                Waktu: {formatTimestamp(currentTime)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-2 relative">
                            {parsedLyrics.length > 0 ? (
                                parsedLyrics.map((line, idx) => {
                                    const isActive = idx === activeLyricIndex;
                                    return (
                                        <div 
                                            key={idx}
                                            ref={isActive ? activeLyricRef : null}
                                            className={`
                                                flex items-center gap-4 p-3 rounded-lg transition-all duration-300
                                                ${isActive ? 'bg-indigo-900/30 border border-indigo-500/50 scale-105' : 'hover:bg-gray-900 border border-transparent'}
                                            `}
                                        >
                                            {/* Timestamp Button */}
                                            <button 
                                                type="button"
                                                onClick={() => syncTimestamp(idx)}
                                                className={`
                                                    font-mono text-xs px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap
                                                    ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}
                                                `}
                                                title="Klik untuk set timestamp ke waktu sekarang"
                                            >
                                                {formatTimestamp(line.time)}
                                            </button>

                                            {/* Lyric Text */}
                                            <p className={`text-sm flex-1 ${isActive ? 'text-white font-bold' : 'text-gray-400'}`}>
                                                {line.text}
                                            </p>

                                            {/* Sync Action Icon */}
                                            <button 
                                                onClick={() => syncTimestamp(idx)}
                                                className="p-2 text-gray-600 hover:text-green-400 transition opacity-0 group-hover:opacity-100"
                                                title="Sync Here"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 mt-20">
                                    <p>Lirik belum tersedia atau format salah.</p>
                                    <p className="text-xs mt-2">Format: [MM:SS.ms] Teks Lirik</p>
                                </div>
                            )}
                        </div>

                        {/* Floating Play Control for Syncing */}
                        <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-center">
                             <button 
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-500 transition active:scale-95"
                             >
                                {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                             </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition">
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        form="song-form" 
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                    </button>
                </div>

            </div>
        </div>
    );
}