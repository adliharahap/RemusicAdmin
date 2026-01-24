"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Image as ImageIcon, User, Music, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';
import { formatNumber } from '../../../../../utils/formatDateAndNumber';

export default function EditArtistModal({ isOpen, onClose, artist, onSuccess }) {
    // --- STATE UTAMA ---
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");

    // --- STATE SONGS ---
    const [songs, setSongs] = useState([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");

    // --- EFFECT: POPULATE DATA ---
    useEffect(() => {
        if (isOpen && artist) {
            setName(artist.name || "");
            setDescription(artist.description || "");
            setPhotoUrl(artist.photo_url || "");

            fetchSongs(artist.id);
        }
    }, [isOpen, artist]);

    const fetchSongs = async (artistId) => {
        setLoadingSongs(true);
        try {
            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .eq('artist_id', artistId)
                .order('play_count', { ascending: false });

            if (error) throw error;
            setSongs(data || []);
        } catch (error) {
            console.error("Error fetching songs:", error);
        } finally {
            setLoadingSongs(false);
        }
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) return alert("Nama artis wajib diisi!");

        setIsUploading(true);
        setUploadStep("Menyimpan Perubahan...");

        try {
            const { error } = await supabase
                .from('artists')
                .update({
                    name: name,
                    normalized_name: name.toLowerCase(),
                    description: description,
                    photo_url: photoUrl
                })
                .eq('id', artist.id);

            if (error) throw error;

            setUploadStep("Selesai!");
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Error updating artist:", error);
            alert(`Gagal: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadStep("");
        }
    };

    if (!isOpen || !artist) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="text-indigo-500" /> Edit Artis
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* LEFT COLUMN: Form */}
                        <div className="flex-1 space-y-6">
                            <form id="edit-artist-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Photo Preview & URL Input */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-32 h-32 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-800 relative ${photoUrl ? 'border-indigo-500' : 'border-dashed border-slate-600'}`}>
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <ImageIcon className="text-slate-500 w-10 h-10" />
                                        )}
                                    </div>

                                    <div className="w-full space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                            <LinkIcon size={12} /> URL Foto
                                        </label>
                                        <input
                                            type="text"
                                            value={photoUrl}
                                            onChange={(e) => setPhotoUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nama Artis <span className="text-red-500">*</span></label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Bio</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none" />
                                </div>
                            </form>
                        </div>

                        {/* RIGHT COLUMN: Songs Table */}
                        <div className="flex-1 flex flex-col min-h-[400px] border-l border-slate-800 pl-0 lg:pl-8">
                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                                <Music size={16} /> Daftar Lagu ({songs.length})
                            </h3>

                            <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden relative">
                                <div className="absolute inset-0 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-900 text-slate-400 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 font-medium">Judul</th>
                                                <th className="p-3 font-medium text-right">Plays</th>
                                                <th className="p-3 font-medium text-right">Likes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {loadingSongs ? (
                                                <tr><td colSpan="3" className="p-8 text-center text-slate-500">Memuat lagu...</td></tr>
                                            ) : songs.length > 0 ? (
                                                songs.map(song => (
                                                    <tr key={song.id} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden shrink-0">
                                                                    {song.cover_url && <img src={song.cover_url} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <span className="text-slate-200 font-medium truncate max-w-[150px]">{song.title}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right text-slate-400">{formatNumber(song.play_count)}</td>
                                                        <td className="p-3 text-right text-slate-400">{formatNumber(song.like_count)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="3" className="p-8 text-center text-slate-500">Belum ada lagu.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isUploading} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                        Batal
                    </button>
                    <button type="submit" form="edit-artist-form" disabled={isUploading} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                        {isUploading ? <><Loader2 size={16} className="animate-spin" /> {uploadStep}</> : <><Save size={16} /> Simpan Perubahan</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
