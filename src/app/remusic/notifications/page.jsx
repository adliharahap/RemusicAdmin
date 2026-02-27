"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Users, User, Type, MessageSquare, Loader2, CheckCircle2, AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";

import { supabase } from "../../../../lib/supabaseClient";

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

export default function NotificationsPage() {
    // Form State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [targetType, setTargetType] = useState("broadcast"); // 'broadcast' | 'targeted'
    const [selectedUsers, setSelectedUsers] = useState([]);

    const applyTemplate = (template) => {
        setTitle(template.title);
        setMessage(template.message);
        setImageUrl(template.image_url || "");
    };

    // Data State
    const [usersWithTokens, setUsersWithTokens] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // UI State
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null); // { type: 'success' | 'error', message: string }

    // Fetch users who have FCM tokens
    useEffect(() => {
        const fetchEligibleUsers = async () => {
            setIsLoadingUsers(true);
            try {
                // Fetch users where fcm_token is NOT NULL or empty
                const { data, error } = await supabase
                    .from('users')
                    .select('id, display_name, email, photo_url, fcm_token')
                    .not('fcm_token', 'is', null)
                    .neq('fcm_token', '');

                if (error) throw error;
                setUsersWithTokens(data || []);
            } catch (error) {
                console.error("Error fetching users for notification:", error);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchEligibleUsers();
    }, []);

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            setSendResult({ type: 'error', message: 'Judul dan isi pesan wajib diisi.' });
            return;
        }

        if (targetType === 'targeted' && selectedUsers.length === 0) {
            setSendResult({ type: 'error', message: 'Pilih minimal 1 user tujuan.' });
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            let payload = { title, message, imageUrl: imageUrl || null };

            if (targetType === 'broadcast') {
                // Instend of using topic 'all', we fetch all available tokens
                // because sometimes the android client isn't subscribed to the topic properly.
                const allTokens = usersWithTokens.map(u => u.fcm_token);
                if (allTokens.length === 0) {
                    setSendResult({ type: 'error', message: 'Belum ada user yang memiliki token FCM.' });
                    setIsSending(false);
                    return;
                }
                payload.tokens = allTokens;
            } else {
                // Get tokens for selected users
                const tokens = usersWithTokens
                    .filter(u => selectedUsers.includes(u.id))
                    .map(u => u.fcm_token);

                if (tokens.length === 0) {
                    setSendResult({ type: 'error', message: 'User yang dipilih tidak memiliki token FCM valid.' });
                    setIsSending(false);
                    return;
                }
                payload.tokens = tokens;
            }

            // 1. Simpan ke Database (Hybrid Approach)
            try {
                if (targetType === 'broadcast') {
                    // Notif Global: user_id = null
                    await supabase.from('notifications').insert({
                        user_id: null,
                        title,
                        message,
                        type: 'system',
                        image_url: imageUrl || null,
                        is_read: false
                    });
                } else {
                    // Notif Personal: Satu baris per user yang dipilih
                    const notifRows = selectedUsers.map(uid => ({
                        user_id: uid,
                        title,
                        message,
                        type: 'system',
                        image_url: imageUrl || null,
                        is_read: false
                    }));
                    await supabase.from('notifications').insert(notifRows);
                }
            } catch (dbErr) {
                console.warn("Gagal menyimpan riwayat notifikasi ke Database:", dbErr);
                // Kita lanjut kirim FCM meskipun DB gagal (optional)
            }

            // 2. Kirim Push Notification via FCM
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to send notification');

            setSendResult({
                type: 'success',
                message: targetType === 'broadcast'
                    ? 'Broadcast notifikasi berhasil dikirim!'
                    : `Notifikasi berhasil dikirim ke ${data.successCount || 0} perangkat.`
            });

            // Reset form on success
            setTitle("");
            setMessage("");
            setImageUrl("");
            setSelectedUsers([]);

        } catch (error) {
            console.error("Send Notif Error:", error);
            setSendResult({ type: 'error', message: error.message || 'Gagal mengirim notifikasi.' });
        } finally {
            setIsSending(false);
        }
    };

    const handleClearNotifications = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus SEMUA riwayat notifikasi dari database? Tindakan ini tidak dapat dibatalkan.")) {
            return;
        }

        setIsSending(true);
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .neq('type', 'completely_unlikely_type_to_keep_everything_deleted');

            if (error) throw error;

            setSendResult({ type: 'success', message: 'Seluruh riwayat notifikasi berhasil dihapus.' });
        } catch (error) {
            console.error("Clear Notif Error:", error);
            alert("Gagal menghapus riwayat: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto min-h-screen bg-slate-50 dark:bg-[#081028] transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-500" />
                        Push Notifications
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Kirim notifikasi langsung ke perangkat pengguna.</p>
                </div>
                <button
                    onClick={handleClearNotifications}
                    disabled={isSending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    Bersihkan Riwayat
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSendNotification} className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-6">

                        {/* Target Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Pengiriman</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Broadcast Option */}
                                <div
                                    onClick={() => setTargetType('broadcast')}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${targetType === 'broadcast'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${targetType === 'broadcast' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${targetType === 'broadcast' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>Broadcast</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Kirim ke semua pengguna</p>
                                        </div>
                                    </div>
                                    {targetType === 'broadcast' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                                </div>

                                {/* Targeted Option */}
                                <div
                                    onClick={() => setTargetType('targeted')}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${targetType === 'targeted'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${targetType === 'targeted' ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${targetType === 'targeted' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>Spesifik</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Pilih pengguna tertentu</p>
                                        </div>
                                    </div>
                                    {targetType === 'targeted' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                                </div>
                            </div>
                        </div>

                        {/* Templates (Only if Broadcast) */}
                        {targetType === 'broadcast' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
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
                                        onClick={() => applyTemplate({ title: "", message: "", image_url: "" })}
                                        className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800/50 border border-transparent rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Type className="w-4 h-4 text-slate-400" />
                                Judul Notifikasi
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Rilis Update Fitur Baru!"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                                maxLength={65}
                            />
                            <p className="text-[10px] text-right text-slate-400">{title.length}/65</p>
                        </div>

                        {/* Message Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                Isi Pesan
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tuliskan detail pesan Anda di sini..."
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white resize-none transition-all"
                                maxLength={240}
                            />
                            <p className="text-[10px] text-right text-slate-400">{message.length}/240</p>
                        </div>

                        {/* Image URL Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                Link Gambar <span className="text-xs font-normal text-slate-400 normal-case">(Opsional)</span>
                            </label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                            />
                        </div>

                        {/* Image Preview */}
                        {imageUrl && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Preview Gambar</label>
                                <div className="p-2 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 inline-flex justify-center overflow-hidden max-w-full">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-48 rounded-lg object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.insertAdjacentHTML('afterend', '<p class="text-xs text-red-500 mt-2">Gambar tidak dapat dimuat. Pastikan link valid.</p>');
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

                        {/* Alert / Feedback */}
                        <AnimatePresence>
                            {sendResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`p-4 rounded-xl flex items-center gap-3 ${sendResult.type === 'success'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                        }`}
                                >
                                    {sendResult.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                    <p className="text-sm font-medium">{sendResult.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={isSending || (targetType === 'targeted' && selectedUsers.length === 0)}
                                className={`
                                    w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                                    ${isSending || (targetType === 'targeted' && selectedUsers.length === 0)
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25 active:scale-[0.98]'
                                    }
                                `}
                            >
                                {isSending ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim...</>
                                ) : (
                                    <><Send className="w-5 h-5" /> Kirim Notifikasi</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar: Targeted Users List */}
                <AnimatePresence mode="wait">
                    {targetType === 'targeted' ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col h-[600px]"
                        >
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 rounded-t-2xl">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                    Pilih Penerima
                                    <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                        {selectedUsers.length} terpilih
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Hanya user yang mengizinkan notifikasi yang tampil.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {isLoadingUsers ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-xs">Memuat users...</span>
                                    </div>
                                ) : usersWithTokens.length > 0 ? (
                                    <div className="space-y-1">
                                        {usersWithTokens.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserToggle(user.id)}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                                                    ? 'bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                                    }`}
                                            >
                                                <img
                                                    src={user.photo_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=random`}
                                                    alt="Avatar"
                                                    className="w-8 h-8 rounded-full bg-slate-200 object-cover shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.display_name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selectedUsers.includes(user.id) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                    {selectedUsers.includes(user.id) && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Belum Ada User</p>
                                        <p className="text-xs text-slate-500 mt-1">Belum ada user yang menyimpan Token Notifikasi (FCM) ke database.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 p-6 flex flex-col items-center justify-center text-center h-[200px] lg:h-auto"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm text-indigo-500 mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Mode Broadcast Aktif</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Pesan ini akan dikirimkan ke <strong>semua perangkat</strong> pengguna yang telah mengizinkan notifikasi aplikasi.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
