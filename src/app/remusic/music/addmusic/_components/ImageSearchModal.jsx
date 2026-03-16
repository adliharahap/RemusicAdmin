import React, { useState } from 'react';
import { Search, X, Loader2, Image as ImageIcon, Music, User, Youtube, Globe, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageSearchModal({ isOpen, onClose, onSelect, type = 'album', theme }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ ytmusic: [], other: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/image-search?q=${encodeURIComponent(query)}&type=${type}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResults({
                ytmusic: data.ytmusic || [],
                other: data.other || []
            });
        } catch (err) {
            console.error(err);
            setError('Gagal mencari gambar. Coba lagi nanti.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectImage = async (item) => {
        if (!item.image) return;

        setIsSelecting(true);
        try {
            const proxyUrl = `/api/image-search?proxy=${encodeURIComponent(item.image)}`;
            const res = await fetch(proxyUrl);
            const blob = await res.blob();

            const extension = item.image.split('.').pop().split('?')[0] || 'jpg';
            const fileName = `${type}_${Date.now()}.${extension}`;
            const file = new File([blob], fileName, { type: blob.type });

            onSelect(file);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Gagal mengambil gambar. Silakan coba gambar lain.');
        } finally {
            setIsSelecting(false);
        }
    };

    const ResultCard = ({ item, idx }) => (
        <motion.button
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => handleSelectImage(item)}
            disabled={isSelecting || !item.image}
            className="group relative flex flex-col gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all text-left disabled:opacity-50 active:scale-[0.98]"
        >
            <div className="aspect-square rounded-[14px] overflow-hidden relative shadow-lg bg-slate-900/50">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 italic text-[10px]">
                        No Image
                    </div>
                )}

                {/* Source Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[8px] font-black text-white/90 uppercase border border-white/10 tracking-widest">
                    {item.source === 'YouTube Music' ? 'YT Music' : item.source}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform tracking-tighter">
                        USE THIS IMAGE
                    </div>
                </div>
            </div>

            <div className="px-1 space-y-0.5">
                <p className="text-[11px] font-bold leading-tight truncate text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.name}</p>
                <p className="text-[10px] opacity-40 truncate font-medium">
                    {typeof item.artist === 'string' ? item.artist : (item.artist?.name || (type === 'artist' ? 'Artist' : 'Various Artists'))}
                </p>
            </div>
        </motion.button>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md transition-all duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] ${theme.cardBg} border ${theme.border} shadow-[0_0_100px_rgba(0,0,0,0.5)]`}
            >

                {/* Header Section */}
                <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${type === 'album' ? 'from-pink-500 to-rose-600' : 'from-emerald-400 to-teal-600'} shadow-lg shadow-indigo-500/10`}>
                            {type === 'album' ? <Music className="text-white" size={24} /> : <User className="text-white" size={24} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter text-white">
                                Asset Intelligence <span className="text-indigo-400">Search</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                                    {isLoading ? 'Fetching high-res assets...' : `Ready for ${type} lookups`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input Container */}
                        <form onSubmit={handleSearch} className="relative group min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input
                                autoFocus
                                type="text"
                                placeholder={`Search ${type === 'album' ? 'album or track' : 'artist name'}...`}
                                className={`w-full pl-12 pr-4 py-3 rounded-2xl ${theme.inputBg} border ${theme.border} focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all font-bold text-sm tracking-tight`}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 opacity-20 group-focus-within:opacity-0 transition-opacity">
                                <Command size={12} />
                                <span className="text-[10px] font-bold">K</span>
                            </div>
                        </form>

                        <button
                            onClick={onClose}
                            className={`p-3 bg-white/5 hover:bg-rose-500/20 rounded-2xl border ${theme.border} transition-all text-white/40 hover:text-rose-400 active:scale-90`}
                            title="Close Modal"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area - THE HORIZONTAL GRID */}
                <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-950/20 custom-scrollbar">

                    {/* Column 1: YouTube Music */}
                    <div className="flex-none lg:flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-white/5">
                        <div className="px-8 py-4 bg-rose-500/5 flex items-center gap-3 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
                            <Youtube size={16} className="text-rose-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80">YouTube Music Results</h3>
                            <div className="ml-auto text-[9px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/10">
                                {results.ytmusic.length} ASSETS
                            </div>
                        </div>

                        <div className="p-6 md:p-8 lg:overflow-y-auto lg:flex-1 custom-scrollbar">
                            {!isLoading && results.ytmusic.length === 0 ? (
                                <EmptyState source="YouTube" icon={Youtube} />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {results.ytmusic.map((item, idx) => (
                                        <ResultCard key={item.id} item={item} idx={idx} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Global Search */}
                    <div className="flex-none lg:flex-1 flex flex-col min-w-0">
                        <div className="px-8 py-4 bg-sky-500/5 flex items-center gap-3 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
                            <Globe size={16} className="text-sky-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400/80">Global Search (iTunes/Deezer)</h3>
                            <div className="ml-auto text-[9px] font-black bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/10">
                                {results.other.length} ASSETS
                            </div>
                        </div>

                        <div className="p-6 md:p-8 lg:overflow-y-auto lg:flex-1 custom-scrollbar">
                            {!isLoading && results.other.length === 0 ? (
                                <EmptyState source="Global" icon={Globe} />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {results.other.map((item, idx) => (
                                        <ResultCard key={item.id} item={item} idx={idx} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Progress Overlay */}
                <AnimatePresence>
                    {(isSelecting || isLoading) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className={`w-20 h-20 rounded-full border-[6px] border-t-indigo-500 ${isLoading ? 'border-indigo-500/20' : 'border-white/10'}`}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {isLoading ? <Search className="text-indigo-400" /> : <ImageIcon className="text-white/40" />}
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-2xl font-black tracking-tighter text-white uppercase italic">
                                    {isLoading ? 'Crawling Repositories' : 'Optimizing High-Res Asset'}
                                </p>
                                <p className="text-[10px] font-medium opacity-40 uppercase tracking-[0.3em]">
                                    {isLoading ? 'Syncing with music meta APIs...' : 'Finalizing blob conversion via proxy...'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Multi-Source</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8_rgba(244,63,94,0.5)]" />
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">YTMusic</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <p className="hidden md:block text-[9px] font-bold opacity-10 uppercase tracking-[0.2em]">© 2026 Remusic</p>
                        <button
                            onClick={onClose}
                            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            Close Modal
                        </button>
                    </div>
                </div>

            </motion.div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
}

const EmptyState = ({ source, icon: Icon }) => (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-5 rounded-[2rem] bg-white/[0.01] border border-dashed border-white/5">
        <div className="p-5 rounded-full bg-white/[0.03] border border-white/5">
            <Icon size={32} strokeWidth={1} className="opacity-20" />
        </div>
        <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest opacity-30">No {source} Results</p>
            <p className="text-[10px] opacity-20 max-w-[200px] mx-auto font-medium">Try searching for the exact artist or album name above</p>
        </div>
    </div>
);
