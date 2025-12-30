import React from 'react';
import { Loader2, Music } from 'lucide-react';

export default function MetadataLoadingModal({ theme }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className={`max-w-sm w-full ${theme.cardBg} border ${theme.border} rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className={`w-16 h-16 rounded-full ${theme.bg} border ${theme.border} flex items-center justify-center relative`}>
                            <Loader2 size={32} className="text-indigo-500 animate-spin" />
                            <Music size={16} className="absolute text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className={`text-lg font-bold ${theme.text}`}>Mengambil Metadata</h3>
                        <p className={`text-sm ${theme.textMuted}`}>Sedang mengambil metadata lagu, mohon tunggu sebentar...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
