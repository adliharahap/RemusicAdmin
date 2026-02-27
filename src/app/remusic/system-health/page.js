"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle, Server, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SystemHealthPage() {
    const [healthStats, setHealthStats] = useState(null);
    const [botStatus, setBotStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Webhook Manager State
    const [webhookInput, setWebhookInput] = useState("");
    const [isSettingWebhook, setIsSettingWebhook] = useState(false);
    
    // Queue State
    const [processingQueue, setProcessingQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressStats, setProgressStats] = useState({ total: 0, success: 0, failed: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [healthRes, botRes] = await Promise.all([
                axios.get('/api/system/health'),
                axios.get('/api/system/telegram-status')
            ]);
            setHealthStats(healthRes.data);
            setBotStatus(botRes.data);
            
            // Initialize queue if not processing
            if (!isProcessing && healthRes.data.expired_songs) {
                setProcessingQueue(healthRes.data.expired_songs.map(s => ({
                    ...s,
                    status: 'pending', // pending, processing, success, error
                    message: ''
                })));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- CONCURRENCY QUEUE PROCESSOR ---
    const processQueue = async () => {
        if (isProcessing) return;
        if (processingQueue.length === 0) return;

        if (!confirm(`Ready to refresh ${processingQueue.length} links?`)) return;

        setIsProcessing(true);
        setProgressStats({ total: processingQueue.length, success: 0, failed: 0 });

        // Helper to process single item
        const processItem = async (item, index) => {
            // Update status to processing
            setProcessingQueue(prev => {
                const newQ = [...prev];
                newQ[index] = { ...newQ[index], status: 'processing' };
                return newQ;
            });

            try {
                // Call API for single ID
                const res = await axios.post('/api/system/refresh-links', { ids: [item.id] });
                
                // Check result
                const result = res.data.results[0]; // We sent one ID, expect one result
                
                if (result.status === 'success') {
                    setProcessingQueue(prev => {
                        const newQ = [...prev];
                        newQ[index] = { ...newQ[index], status: 'success' };
                        return newQ;
                    });
                    setProgressStats(prev => ({ ...prev, success: prev.success + 1 }));
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            } catch (err) {
                setProcessingQueue(prev => {
                    const newQ = [...prev];
                    newQ[index] = { ...newQ[index], status: 'error', message: err.message };
                    return newQ;
                });
                setProgressStats(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        };

        // Run with concurrency limit of 3
        const CONCURRENCY = 3;
        const queueCopy = [...processingQueue]; // We use index to reference
        
        // Simple batching loop
        for (let i = 0; i < queueCopy.length; i += CONCURRENCY) {
            const batch = queueCopy.slice(i, i + CONCURRENCY);
            const promises = batch.map((_, batchIdx) => processItem(queueCopy[i + batchIdx], i + batchIdx));
            await Promise.all(promises);
        }

        setIsProcessing(false);
        // Refresh stats after done
        fetchData();
    };

    // --- WEBHOOK MANAGER ---
    const handleSetWebhook = async (url, isProduction = false, dropPendingUpdates = false) => {
        if (!isProduction && !url) return alert("URL tidak boleh kosong!");
        if (!isProduction && !url.startsWith("https://")) return alert("URL harus menggunakan https://");

        setIsSettingWebhook(true);
        try {
            const res = await axios.post('/api/system/telegram-webhook', { url, isProduction, dropPendingUpdates });
            if (res.data.success) {
                alert(res.data.message);
                setWebhookInput("");
                fetchData(); // refresh status
            }
        } catch (error) {
            console.error("Failed to set webhook:", error);
            alert("Gagal mengubah webhook: " + (error.response?.data?.error || error.message));
        } finally {
            setIsSettingWebhook(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Health</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor broken links and bot status</p>
                </div>
                <button 
                    onClick={fetchData} 
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: STATUS CARDS */}
                <div className="space-y-6">
                    {/* Expired Count Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Expired Links</h3>
                                <p className="text-sm text-slate-500">Total broken links</p>
                            </div>
                        </div>
                        
                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            {healthStats ? healthStats.expired_count : '...'}
                        </div>

                        <button
                            onClick={processQueue}
                            disabled={isProcessing || !processingQueue.length}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing ({progressStats.success + progressStats.failed}/{progressStats.total})
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Start Refresh Batch ({processingQueue.length})
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Bot Status Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bot Status</h3>
                                <p className="text-sm text-slate-500">Webhook Health</p>
                            </div>
                        </div>

                        {botStatus ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                                    {botStatus.ok ? (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-green-500">
                                            <CheckCircle className="w-4 h-4" /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                                            <XCircle className="w-4 h-4" /> Error
                                        </span>
                                    )}
                                </div>
                                {botStatus.result && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Pending</span>
                                            {botStatus.result.pending_update_count > 0 && (
                                                <button 
                                                    onClick={() => handleSetWebhook(botStatus.result.url, false, true)}
                                                    disabled={isSettingWebhook}
                                                    className="text-[10px] text-red-500 hover:text-red-700 hover:underline mt-0.5 text-left font-medium transition-colors cursor-pointer text-indigo"
                                                >
                                                    Tap to Drop Pending
                                                </button>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${botStatus.result.pending_update_count > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                            {botStatus.result.pending_update_count}
                                        </span>
                                    </div>
                                )}
                                {botStatus.result?.url && (
                                     <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 break-all">
                                         <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Active Webhook URL</span>
                                         <a href={botStatus.result.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                             {botStatus.result.url}
                                         </a>
                                     </div>
                                )}
                                
                                {/* Webhook Manager Form */}
                                <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-3 mt-4">
                                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ganti URL Webhook</span>
                                     <div className="flex gap-2">
                                         <input 
                                            type="text" 
                                            value={webhookInput}
                                            onChange={(e) => setWebhookInput(e.target.value)}
                                            placeholder="https://ngrok-url-anda" 
                                            className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 ring-indigo-500/50"
                                         />
                                         <button 
                                            onClick={() => handleSetWebhook(webhookInput, false)}
                                            disabled={isSettingWebhook || !webhookInput}
                                            className="px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
                                         >
                                             {isSettingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Local"}
                                         </button>
                                     </div>
                                     <button 
                                        type="button"
                                        onClick={() => handleSetWebhook('', true)}
                                        disabled={isSettingWebhook}
                                        className="w-full py-2 px-3 border-2 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                     >
                                         Set URL Production (Vercel)
                                     </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-pulse space-y-3">
                                <div className="h-10 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
                            </div>
                        )}
                    </motion.div>

                    {/* System Info Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Info</h3>
                                <p className="text-sm text-slate-500">Environment & Config</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Environment</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {process.env.NODE_ENV || 'development'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Timezone</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: QUEUE LIST */}
                <div className="lg:col-span-2">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-[#161922] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px]"
                    >
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Refresh Queue</h3>
                                <p className="text-sm text-slate-500">List of songs to be refreshed</p>
                            </div>
                            {isProcessing && (
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <span className="text-green-500">{progressStats.success} Success</span>
                                    <span className="text-red-500">{progressStats.failed} Failed</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {processingQueue.length > 0 ? (
                                processingQueue.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            item.status === 'processing' 
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' 
                                                : item.status === 'success'
                                                ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                                                : item.status === 'error'
                                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                                : 'bg-slate-50 dark:bg-white/5 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                item.status === 'processing' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' :
                                                item.status === 'success' ? 'bg-green-100 dark:bg-green-500/20 text-green-600' :
                                                item.status === 'error' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                                                'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                            }`}>
                                                {item.status === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                 item.status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                                 item.status === 'error' ? <XCircle className="w-4 h-4" /> :
                                                 <Clock className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {item.artists?.name || "Unknown Artist"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Status Text / Error Message */}
                                            {item.status === 'error' ? (
                                                <span className="text-xs text-red-500 max-w-[150px] truncate" title={item.message}>
                                                    {item.message}
                                                </span>
                                            ) : item.status === 'processing' ? (
                                                <span className="text-xs text-indigo-500 font-medium animate-pulse">
                                                    Refreshing...
                                                </span>
                                            ) : item.status === 'success' ? (
                                                <span className="text-xs text-green-500 font-medium">
                                                    Updated
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    Waiting
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                                    <p>All systems operational</p>
                                    <p className="text-sm">No expired links found in this batch</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
