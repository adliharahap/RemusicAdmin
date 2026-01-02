import React from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function UploadStatusModal({ isOpen, steps, onClose, isCompleted, theme }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${theme.cardBg} border ${theme.border} animate-in fade-in zoom-in duration-200`}>
                {/* Header */}
                <div className={`p-4 border-b ${theme.border} flex justify-between items-center bg-indigo-500/5`}>
                    <h3 className={`font-bold text-lg ${theme.text}`}>Upload Status</h3>
                    {isCompleted && (
                        <button onClick={onClose} className={`p-1 rounded-full hover:bg-black/10 ${theme.textMuted}`}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {steps.map((step, index) => (
                        <div key={step.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${step.status === 'loading' ? 'bg-indigo-500/10' :
                                step.status === 'error' ? 'bg-red-500/10' :
                                    'hover:bg-black/5'
                            }`}>
                            {/* Icon */}
                            <div className={`mt-0.5 shrink-0`}>
                                {step.status === 'pending' && <div className={`w-5 h-5 rounded-full border-2 ${theme.border} opacity-30`} />}
                                {step.status === 'loading' && <Loader2 className="animate-spin text-indigo-500" size={20} />}
                                {step.status === 'success' && <div className="bg-emerald-500 rounded-full p-0.5"><Check className="text-white" size={16} /></div>}
                                {step.status === 'error' && <div className="bg-red-500 rounded-full p-0.5"><X className="text-white" size={16} /></div>}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${step.status === 'pending' ? theme.textMuted :
                                        step.status === 'error' ? 'text-red-500' :
                                            theme.text
                                    }`}>
                                    {step.label}
                                </p>
                                {step.error && (
                                    <p className="text-xs text-red-400 mt-1 break-words">
                                        {step.error}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${theme.border} bg-indigo-500/5`}>
                    {isCompleted ? (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                        >
                            Selesai
                        </button>
                    ) : (
                        <div className="flex justify-center">
                            <p className={`text-xs ${theme.textMuted} animate-pulse`}>
                                Mohon tunggu, jangan tutup halaman ini...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
