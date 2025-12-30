import React from 'react';
import { Github, FileAudio, MessageCircle, Image as ImageIcon, Video } from 'lucide-react';

export default function FileUploadSection({
    theme,
    // Props Audio
    handleAudioChange, telegramFileId, setTelegramFileId,
    // Props Cover
    coverPreviewUrl, handleCoverChange,
    // Props Canvas
    handleCanvasChange
}) {
    return (
        <div className={`p-5 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-5 relative`}>
            <div className="absolute top-4 right-4 text-xs opacity-50 flex items-center gap-1">
                <Github size={12} /> Storage by GitHub
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4">Files & Assets</h3>

            {/* Audio Source */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/20 border border-dashed border-slate-700">
                <label className="text-xs font-bold text-indigo-400 uppercase">Audio Source</label>

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
                    <input type="file" accept="image/*" onChange={handleCoverChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`} />
                </div>
            </div>

            {/* Canvas Input */}
            <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-2">
                    <Video size={14} className="text-emerald-400" /> Canvas Video (MP4)
                </label>
                <input type="file" accept="video/mp4" onChange={handleCanvasChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`} />
            </div>
        </div>
    );
}