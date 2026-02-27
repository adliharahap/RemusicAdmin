"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Loader2, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../../../lib/supabaseClient";

export default function BanUserModal({ isOpen, onClose, user, onSuccess }) {
    const [durationVal, setDurationVal] = useState("");
    const [durationType, setDurationType] = useState("minutes"); // minutes, hours, days, permanent
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if the user is currently banned
    const isCurrentlyBanned = user?.banned_until && new Date(user.banned_until) > new Date();

    useEffect(() => {
        if (isOpen && user) {
            setDurationVal("");
            setDurationType("minutes");
            setReason(isCurrentlyBanned ? (user.ban_reason || "") : "");
        }
    }, [isOpen, user, isCurrentlyBanned]);

    if (!isOpen || !user) return null;

    const handleBanSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            return alert("Alasan ban wajib diisi.");
        }

        if (durationType !== 'permanent' && (!durationVal || isNaN(durationVal) || parseInt(durationVal) <= 0)) {
            return alert("Masukkan durasi ban yang valid.");
        }

        setIsSubmitting(true);

        try {
            let bannedUntilDate = new Date();

            if (durationType === 'permanent') {
                bannedUntilDate.setFullYear(2099); // Set far into the future
            } else {
                const amount = parseInt(durationVal);
                if (durationType === 'minutes') {
                    bannedUntilDate.setMinutes(bannedUntilDate.getMinutes() + amount);
                } else if (durationType === 'hours') {
                    bannedUntilDate.setHours(bannedUntilDate.getHours() + amount);
                } else if (durationType === 'days') {
                    bannedUntilDate.setDate(bannedUntilDate.getDate() + amount);
                }
            }

            const { error } = await supabase
                .from('users')
                .update({
                    banned_until: bannedUntilDate.toISOString(),
                    ban_reason: reason.trim()
                })
                .eq('id', user.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Gagal melakukan ban pengguna: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnban = async () => {
        if (!window.confirm(`Yakin ingin membebaskan (Unban) ${user.display_name}?`)) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    banned_until: null,
                    ban_reason: null
                })
                .eq('id', user.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error unbanning user:", error);
            alert("Gagal melakukan unban pengguna: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`flex items-center gap-3 ${isCurrentlyBanned ? 'text-emerald-500' : 'text-red-500'}`}>
                            <div className={`p-2 rounded-lg ${isCurrentlyBanned ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                {isCurrentlyBanned ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {isCurrentlyBanned ? 'Pencabutan Ban (Unban)' : 'Ban Pengguna'}
                                </h3>
                                <p className="text-sm text-slate-500 truncate max-w-[200px]">{user.display_name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isCurrentlyBanned ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Status Saat Ini: Banned</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <strong>Alasan:</strong> {user.ban_reason}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Berakhir pada: {new Date(user.banned_until).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Apakah Anda yakin ingin mencabut status ban pengguna ini sekarang? Mereka akan langsung bisa mengakses aplikasi lagi.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUnban}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pasti, Unban Sekarang"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleBanSubmit} className="space-y-5">
                            {/* Duration */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Durasi Hukuman</label>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    <button type="button" onClick={() => { setDurationType('minutes'); setDurationVal('15'); }} className="px-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-transparent focus:border-red-500">15 Menit</button>
                                    <button type="button" onClick={() => { setDurationType('hours'); setDurationVal('1'); }} className="px-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-transparent focus:border-red-500">1 Jam</button>
                                    <button type="button" onClick={() => { setDurationType('days'); setDurationVal('1'); }} className="px-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-transparent focus:border-red-500">1 Hari</button>
                                    <button type="button" onClick={() => { setDurationType('permanent'); setDurationVal(''); }} className={`px-2 py-1.5 text-xs rounded-lg transition-colors border border-transparent focus:border-red-500 ${durationType === 'permanent' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Permanen</button>
                                </div>

                                {durationType !== 'permanent' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={durationVal}
                                            onChange={(e) => setDurationVal(e.target.value)}
                                            placeholder="Angka"
                                            className="w-1/2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                            required={durationType !== 'permanent'}
                                        />
                                        <select
                                            value={durationType}
                                            onChange={(e) => setDurationType(e.target.value)}
                                            className="w-1/2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                        >
                                            <option value="minutes">Menit</option>
                                            <option value="hours">Jam</option>
                                            <option value="days">Hari</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alasan Ban</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Tulis alasan pelanggaran (contoh: spam komentar, berkata kasar)..."
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white resize-none"
                                    required
                                />
                                <p className="text-[10px] text-slate-500">Alasan ini wajib diisi dan mungkin akan terlihat oleh pengguna yang dibanned.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim() || (durationType !== 'permanent' && !durationVal)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ban Pengguna"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
