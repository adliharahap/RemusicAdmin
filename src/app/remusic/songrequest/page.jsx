"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Music2,
    Loader2,
    Mail,
    X,
    AlertTriangle
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { formatDate } from "../../../../utils/formatDateAndNumber";

export default function SongRequestPage() {
    const [filter, setFilter] = useState("all");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedRejectId, setSelectedRejectId] = useState(null);

    // Fetch Requests
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('song_requests')
                .select(`
                    *,
                    requester:users!requester_id (
                        id, display_name, email, photo_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Update Status Handler
    const handleStatusChange = async (id, newStatus) => {
        // Prevent changing if already fulfilled (Published)
        const currentRequest = requests.find(r => r.id === id);
        if (currentRequest?.status === 'fulfilled') return;

        // If Rejected, open modal first
        if (newStatus === 'rejected') {
            setSelectedRejectId(id);
            setRejectReason("");
            setIsRejectModalOpen(true);
            return;
        }

        // Direct update for other statuses
        await updateRequestStatus(id, newStatus);
    };

    const updateRequestStatus = async (id, status, reason = null) => {
        setUpdatingId(id);
        try {
            const updateData = { status };
            if (reason) updateData.rejection_reason = reason;

            const { error } = await supabase
                .from('song_requests')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Optimistic Update
            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status, rejection_reason: reason } : req
            ));

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Gagal mengupdate status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmRejection = async () => {
        if (!rejectReason.trim()) return alert("Alasan penolakan wajib diisi.");

        await updateRequestStatus(selectedRejectId, 'rejected', rejectReason);
        setIsRejectModalOpen(false);
        setSelectedRejectId(null);
    };

    // Helper: Status Config
    const STATUS_CONFIG = {
        pending: { label: "Pending", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Clock },
        approved: { label: "On Working", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Loader2 },
        rejected: { label: "Issue/Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
        fulfilled: { label: "Published", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
    };

    const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    // Filter Logic
    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === "all" || req.status === filter;
        const matchesSearch =
            req.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.requester?.display_name || "").toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-6 space-y-6 min-h-screen bg-slate-50 dark:bg-[#081028] transition-colors duration-300 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Song Requests</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Manage song requests from users</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {Object.keys(STATUS_CONFIG).map((key) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key === filter ? "all" : key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${filter === key
                                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                        >
                            {STATUS_CONFIG[key].label}
                        </button>
                    ))}
                    {filter !== "all" && (
                        <button onClick={() => setFilter("all")} className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Song Details</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requested By</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading requests...
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredRequests.map((request) => {
                                        const statusCfg = getStatusConfig(request.status);
                                        const StatusIcon = statusCfg.icon;
                                        const isPublished = request.status === 'fulfilled';

                                        return (
                                            <motion.tr
                                                key={request.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                            <Music2 className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">{request.song_title}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{request.artist_name}</p>
                                                            {request.note && (
                                                                <p className="text-[10px] text-slate-400 mt-0.5 italic">"{request.note}"</p>
                                                            )}
                                                            {request.rejection_reason && request.status === 'rejected' && (
                                                                <p className="text-[10px] text-red-400 mt-0.5 font-medium">Reason: {request.rejection_reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={request.requester?.photo_url || `https://ui-avatars.com/api/?name=${request.requester?.display_name || 'User'}&background=random`}
                                                            alt="Avatar"
                                                            className="w-6 h-6 rounded-full bg-slate-200 object-cover"
                                                        />
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">{request.requester?.display_name || "Unknown User"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(request.created_at)}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="relative group/status">
                                                        <select
                                                            value={request.status}
                                                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                            disabled={updatingId === request.id || isPublished}
                                                            className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-xs font-medium border outline-none transition-all ${statusCfg.color} ${updatingId === request.id || isPublished ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                                                                }`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="approved">On Working</option>
                                                            <option value="rejected">Issue/Rejected</option>
                                                            <option value="fulfilled">Published</option>
                                                        </select>
                                                        <StatusIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                        {updatingId === request.id && (
                                                            <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-current" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {request.status === 'fulfilled' && request.requester?.email && (
                                                            <a
                                                                href={`mailto:${request.requester.email}?subject=Lagu Request Anda Telah Ditambahkan! - Remusic&body=Halo ${request.requester.display_name},%0D%0A%0D%0AKabar gembira! Lagu yang Anda request "%20${request.song_title} - ${request.artist_name}%20" telah kami tambahkan ke Remusic.%0D%0A%0D%0ASilakan cek aplikasi sekarang untuk mendengarkannya!%0D%0A%0D%0ATerima kasih,%0D%0ATim Remusic`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                title="Kirim Email Notifikasi"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {request.reference_url && (
                                                            <a
                                                                href={request.reference_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                                title="Lihat Referensi Link"
                                                            >
                                                                <Music2 className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredRequests.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No requests found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3 text-red-500">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tolak Request</h3>
                                    </div>
                                    <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    Silakan berikan alasan mengapa request ini ditolak. Alasan ini akan terlihat oleh user.
                                </p>

                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Contoh: Lagu tidak tersedia di platform streaming..."
                                    className="w-full h-32 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white resize-none mb-4"
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsRejectModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmRejection}
                                        disabled={!rejectReason.trim() || updatingId}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tolak Request"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
