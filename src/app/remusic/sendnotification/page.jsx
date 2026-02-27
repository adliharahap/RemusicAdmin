"use client";

import React, { useState, useEffect } from 'react';
import { Send, Bell, Search, User, Users, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

const NOTIFICATION_TEMPLATES = [
    {
        label: "🛠️ Maintenance Server",
        title: "Maintenance Server",
        message: "Halo! Server saat ini sedang dalam masa perbaikan rutin untuk meningkatkan performa. Aplikasi mungkin akan tidak stabil selama beberapa saat. Terima kasih atas pengertiannya.",
        type: "warning",
        image_url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=800&auto=format&fit=crop"
    },
    {
        label: "🚀 Update Fitur",
        title: "Update Fitur Baru!",
        message: "Halo! Kami baru saja merilis fitur-fitur baru dan perbaikan bug. Silakan muat ulang (refresh) atau update aplikasi Anda untuk menikmati pengalaman yang lebih baik!",
        type: "info",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop"
    },
    {
        label: "ℹ️ Info Sistem",
        title: "Pemberitahuan Sistem",
        message: "Kami menemukan sedikit gangguan pada beberapa layanan, tim kami sedang menanganinya. Mohon maaf atas ketidaknyamanan ini.",
        type: "warning",
        image_url: ""
    },
    {
        label: "🎉 Event Spesial",
        title: "Event Spesial Baru!",
        message: "Dengarkan playlist khusus yang baru saja kami rilis untuk menemani harimu. Jangan sampai ketinggalan!",
        type: "success",
        image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop"
    }
];

export default function SendNotificationPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [type, setType] = useState("info"); // info, warning, success
    const [target, setTarget] = useState("broadcast"); // broadcast, specific

    // Specific User Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [loading, setLoading] = useState(false);

    const applyTemplate = (template) => {
        setTitle(template.title);
        setMessage(template.message);
        setType(template.type);
        setImageUrl(template.image_url || "");
    };

    // Search Users Effect
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim() || selectedUser) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, display_name, email, photo_url')
                    .ilike('display_name', `%${searchQuery}%`)
                    .limit(5);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedUser]);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            alert("Judul dan Pesan wajib diisi!");
            return;
        }

        if (target === 'specific' && !selectedUser) {
            alert("Pilih user tujuan terlebih dahulu!");
            return;
        }

        setLoading(true);

        try {
            // Payload
            const payload = {
                title,
                message,
                image_url: imageUrl || null,
                type,
                is_read: false,
                created_at: new Date().toISOString(),
                // Jika broadcast, user_id null. Jika specific, user_id dari selectedUser
                user_id: target === 'specific' ? selectedUser.id : null
            };

            // Jika broadcast tapi tabel tidak support null user_id untuk global, 
            // kita mungkin perlu loop semua user. 
            // TAPI untuk efisiensi, kita asumsikan sistem notifikasi di client app 
            // sudah handle logic: if (user_id == null) -> show to all.

            const { error } = await supabase
                .from('notifications')
                .insert(payload);

            if (error) throw error;

            alert("Notifikasi berhasil dikirim!");

            // Reset Form
            setTitle("");
            setMessage("");
            setImageUrl("");
            setType("info");
            setTarget("broadcast");
            setSelectedUser(null);
            setSearchQuery("");

        } catch (error) {
            console.error("Error sending notification:", error);
            alert(`Gagal mengirim notifikasi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="text-indigo-600 dark:text-indigo-500" /> Kirim Notifikasi
                </h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Kirim pengumuman, info maintenance, atau pesan personal ke pengguna.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <form onSubmit={handleSend} className="p-6 space-y-6">

                    {/* Target Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tujuan Notifikasi</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                onClick={() => setTarget('broadcast')}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${target === 'broadcast' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                                <div className={`p-2 rounded-full ${target === 'broadcast' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Broadcast (Semua User)</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Kirim ke seluruh pengguna aplikasi.</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setTarget('specific')}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${target === 'specific' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                                <div className={`p-2 rounded-full ${target === 'specific' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Personal (Spesifik User)</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Kirim ke satu pengguna tertentu.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Search (Only if Specific) */}
                    {target === 'specific' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Cari Pengguna</label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={selectedUser.photo_url || `https://ui-avatars.com/api/?name=${selectedUser.display_name}&background=random`}
                                            alt={selectedUser.display_name}
                                            className="w-10 h-10 rounded-full bg-slate-200"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{selectedUser.display_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ketik nama pengguna..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                    {/* Dropdown Results */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                            {searchResults.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedUser(user)}
                                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                                >
                                                    <img
                                                        src={user.photo_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=random`}
                                                        alt={user.display_name}
                                                        className="w-8 h-8 rounded-full bg-slate-200"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.display_name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Templates (Only if Broadcast) */}
                    {target === 'broadcast' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                Template Cepat <span className="text-xs font-normal text-slate-400 normal-case">(Opsional)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {NOTIFICATION_TEMPLATES.map((tmpl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyTemplate(tmpl)}
                                        className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {tmpl.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => applyTemplate({ title: "", message: "", type: "info", image_url: "" })}
                                    className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800/50 border border-transparent rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Judul Notifikasi</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Maintenance Server"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tipe Notifikasi</label>
                            <div className="flex gap-2">
                                {['info', 'warning', 'success'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-3 rounded-xl border transition-all capitalize flex items-center justify-center gap-2 ${type === t
                                            ? t === 'info' ? 'bg-blue-500 text-white border-blue-500'
                                                : t === 'warning' ? 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {t === 'info' && <Info size={18} />}
                                        {t === 'warning' && <AlertTriangle size={18} />}
                                        {t === 'success' && <CheckCircle size={18} />}
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pesan</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tulis pesan notifikasi di sini..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-32 resize-none"
                        />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                Link Gambar <span className="text-xs font-normal text-slate-400 normal-case">(Opsional)</span>
                            </label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>

                        {/* Image Preview */}
                        {imageUrl && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Preview Gambar</label>
                                <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 inline-flex justify-center overflow-hidden max-w-full">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-48 rounded-lg object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.insertAdjacentHTML('afterend', '<p class="text-sm text-red-500 mt-2">Gambar tidak dapat dimuat. Pastikan link valid.</p>');
                                        }}
                                        onLoad={(e) => {
                                            e.target.style.display = 'block';
                                            const errorMsg = e.target.nextElementSibling;
                                            if (errorMsg && errorMsg.tagName === 'P') {
                                                errorMsg.remove();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>Mengirim...</>
                            ) : (
                                <><Send size={20} /> Kirim Notifikasi</>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
