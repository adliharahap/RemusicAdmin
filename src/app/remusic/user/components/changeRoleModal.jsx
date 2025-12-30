"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, UserCog } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';

export default function ChangeRoleModal({ isOpen, onClose, user, onSuccess }) {
    const [selectedRole, setSelectedRole] = useState("listener");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role || "listener");
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: selectedRole })
                .eq('id', user.id);

            if (error) throw error;

            alert("Role pengguna berhasil diperbarui!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating role:", error);
            alert(`Gagal memperbarui role: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCog className="text-indigo-600 dark:text-indigo-500" /> Ubah Role Pengguna
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <form id="change-role-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Pengguna</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.display_name || "Tanpa Nama"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pilih Role Baru</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="listener">Listener</option>
                                <option value="uploader">Uploader</option>
                                <option value="owner">Owner</option>
                            </select>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                * Owner memiliki akses penuh. Uploader dapat mengelola konten. Listener hanya dapat melihat.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="change-role-form"
                        disabled={loading}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                        ) : (
                            <><Save size={16} /> Simpan Perubahan</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
