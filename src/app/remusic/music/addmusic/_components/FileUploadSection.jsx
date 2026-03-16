import React from 'react';
import { Github, FileAudio, MessageCircle, Image as ImageIcon, Video, Clipboard, X, Search } from 'lucide-react';
import ImageSearchModal from './ImageSearchModal';

export default function FileUploadSection({
    theme,
    // Props Audio
    handleAudioChange, telegramFileId, setTelegramFileId,
    // Props Cover
    coverPreviewUrl, handleCoverChange, handleClearCover,
    // Props Canvas
    handleCanvasChange, handleClearCanvas, canvasFile, canvasPreviewUrl,
    // Props Duration
    duration = 0
}) {
    // Format Duration Helper
    const formatDuration = (ms) => {
        if (!ms) return "0:00";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

    return (
        <div className={`p-5 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-5 relative`}>
            <div className="absolute top-4 right-4 text-xs opacity-50 flex items-center gap-1">
                <Github size={12} /> Storage by GitHub
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4">Files & Assets</h3>

            {/* Audio Source */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/20 border border-dashed border-slate-700">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-indigo-400 uppercase">Audio Source</label>
                    {duration > 0 && (
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                            Duration: {formatDuration(duration)}
                        </span>
                    )}
                </div>

                <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-2">
                        <FileAudio size={14} /> Upload MP3/WAV <span className="text-[10px] font-normal opacity-50">(For Streaming)</span>
                    </label>
                    <input type="file" accept="audio/*" onChange={handleAudioChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`} />
                </div>

                <div className="flex items-center gap-2 opacity-50"><div className="h-px bg-slate-600 flex-1"></div><span className="text-[10px]">OR</span><div className="h-px bg-slate-600 flex-1"></div></div>

                <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-2">
                        <MessageCircle size={14} className="text-sky-500" /> Telegram Audio File ID
                    </label>
                    <input
                        type="text"
                        value={telegramFileId}
                        onChange={(e) => setTelegramFileId(e.target.value)}
                        placeholder="Paste file_id here..."
                        className={`w-full ${theme.inputBg} border ${theme.border} rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none font-mono`}
                    />
                </div>
            </div>

            {/* Cover Input */}
            <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2">
                    <ImageIcon size={14} className="text-pink-400" /> Cover Image <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 items-center">
                    {coverPreviewUrl && <img src={coverPreviewUrl} className="w-12 h-12 rounded-lg object-cover border border-slate-700" alt="Cover Preview" />}
                    <div className="relative w-full flex gap-2">
                        <input type="file" accept="image/*" onChange={handleCoverChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`} />
                        {coverPreviewUrl && (
                            <button
                                type="button"
                                onClick={handleClearCover}
                                className={`px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-rose-500`}
                                title="Clear Cover"
                            >
                                <X size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const clipboardItems = await navigator.clipboard.read();
                                    for (const item of clipboardItems) {
                                        if (item.types.some(type => type.startsWith('image/'))) {
                                            const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                                            const file = new File([blob], "pasted_cover.png", { type: blob.type });
                                            handleCoverChange(file);
                                            return;
                                        }
                                    }
                                    alert("No image found in clipboard");
                                } catch (err) {
                                    console.error(err);
                                    alert("Failed to read clipboard. Please allow permissions.");
                                }
                            }}
                            className={`px-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} hover:bg-slate-800 transition-colors text-pink-400`}
                            title="Paste from Clipboard"
                        >
                            <Clipboard size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSearchModalOpen(true)}
                            className={`px-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} hover:bg-slate-800 transition-colors text-indigo-400`}
                            title="Search Online"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>

                <ImageSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={(file) => handleCoverChange(file)}
                    type="song"
                    theme={theme}
                />
            </div>

            {/* Canvas Input */}
            <div className="space-y-3">
                <label className="text-xs font-semibold flex items-center gap-2">
                    <Video size={14} className="text-emerald-400" /> Canvas Video (MP4)
                </label>

                {canvasPreviewUrl && (
                    <div className="w-full max-w-[180px] aspect-[9/16] rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl group relative">
                        <video
                            src={canvasPreviewUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-2 text-[8px] font-bold text-white/50 uppercase tracking-widest">Preview 9:16</div>
                    </div>
                )}

                <div className="flex gap-2">
                    <input type="file" accept="video/mp4" onChange={handleCanvasChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`} />
                    {canvasFile && (
                        <button
                            type="button"
                            onClick={handleClearCanvas}
                            className={`px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-rose-500`}
                            title="Clear Canvas"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}