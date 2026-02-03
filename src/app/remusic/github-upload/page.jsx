"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, User, FileVideo, Check, X, Clipboard, Loader2, Image as ImageIcon, Music, Video, AlertTriangle } from "lucide-react";
import ImageCropperModal from "../music/addmusic/_components/ImageCropperModal";

const GithubUploadPage = () => {
    const [mounted, setMounted] = useState(false);

    // --- UPLOAD STATES ---
    const [activeModal, setActiveModal] = useState(null); // 'artist' | 'content' | null

    // ARTIST
    const [artistFile, setArtistFile] = useState(null);
    const [artistPreviewUrl, setArtistPreviewUrl] = useState(null);

    // CONTENT (Cover/Canvas)
    const [contentType, setContentType] = useState('cover'); // 'cover' | 'canvas'
    const [contentFile, setContentFile] = useState(null);
    const [contentPreviewUrl, setContentPreviewUrl] = useState(null);

    // SHARED
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [croppingImage, setCroppingImage] = useState(null);
    const [croppingType, setCroppingType] = useState(null); // 'artist' | 'cover'

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (artistPreviewUrl) URL.revokeObjectURL(artistPreviewUrl);
            if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl);
        };
    }, []);

    // Helper: Read file as Data URL
    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    // --- HANDLERS: FILE SELECTION ---

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            handleFileProcessing(file, type);
        }
        e.target.value = null;
    };

    const handlePaste = async (type) => {
        // Paste only supports Images for now (Browser limit)
        try {
            const clipboardItems = await navigator.clipboard.read();
            let foundImage = false;

            for (const item of clipboardItems) {
                if (item.types.some(t => t.startsWith('image/'))) {
                    const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                    // Force name to png
                    const file = new File([blob], "pasted_image.png", { type: blob.type });
                    handleFileProcessing(file, type);
                    foundImage = true;
                    break;
                }
            }

            if (!foundImage) {
                alert("No image found in clipboard.");
            }
        } catch (err) {
            console.error("Clipboard Error:", err);
            alert("Failed to access clipboard or no support.");
        }
    };

    const handleFileProcessing = async (file, type) => {
        // type: 'artist' | 'cover' | 'canvas'
        setUploadError(null);
        setUploadedUrl(null);

        if (type === 'canvas') {
            // Video - No Crop
            if (!file.type.startsWith('video/')) {
                alert("Please select a video file (MP4).");
                return;
            }
            if (file.size > 6 * 1024 * 1024) {
                alert("Video too large. Max 6MB.");
                return;
            }
            setContentFile(file);
            setContentPreviewUrl(URL.createObjectURL(file));
        } else {
            // Image - Crop 1:1
            if (!file.type.startsWith('image/')) {
                alert("Please select an image file.");
                return;
            }
            try {
                const val = await readFile(file);
                setCroppingImage(val);
                setCroppingType(type); // 'artist' or 'cover'
                setIsCropperOpen(true);
            } catch (e) {
                console.error("Error reading file:", e);
                alert("Failed to read file.");
            }
        }
    };

    // --- HANDLERS: CROP & UPLOAD ---

    const handleCropComplete = (croppedBlob) => {
        const isArtist = croppingType === 'artist';
        const timestamp = Date.now();
        const file = new File([croppedBlob], `${isArtist ? 'artist' : 'cover'}_${timestamp}.jpg`, { type: "image/jpeg" });

        if (isArtist) {
            setArtistFile(file);
            setArtistPreviewUrl(URL.createObjectURL(croppedBlob));
        } else {
            setContentFile(file);
            setContentPreviewUrl(URL.createObjectURL(croppedBlob));
        }

        setIsCropperOpen(false);
        setCroppingImage(null);
        setCroppingType(null);
    };

    const handleUpload = async (target) => {
        // target: 'artist' | 'content'
        const fileToUpload = target === 'artist' ? artistFile : contentFile;
        if (!fileToUpload) return;

        // Check size again just in case (though API checks too)
        if (target === 'content') {
            const isVideo = fileToUpload.type.startsWith('video/');
            const limit = isVideo ? 6 * 1024 * 1024 : 4 * 1024 * 1024;
            if (fileToUpload.size > limit) {
                setUploadError(`File too large.Max ${limit / 1024 / 1024} MB.`);
                return;
            }
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadedUrl(null);

        const apiEndpoint = target === 'artist' ? '/api/github-upload-artist' : '/api/github-upload-content';

        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('message', `Upload ${target} via Admin UI`);

            const res = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setUploadedUrl(data.url);
            // Clean up preview
            if (target === 'artist') setArtistFile(null);
            else setContentFile(null);

        } catch (err) {
            console.error("Upload failed:", err);
            setUploadError(err.message || "An unexpected error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("URL copied!");
    };

    const resetModals = () => {
        setActiveModal(null);
        setArtistFile(null);
        setContentFile(null);
        setUploadedUrl(null);
        setUploadError(null);
        if (artistPreviewUrl) URL.revokeObjectURL(artistPreviewUrl);
        if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl);
        setArtistPreviewUrl(null);
        setContentPreviewUrl(null);
    };

    // --- UI COMPONENTS ---
    const theme = {
        bg: 'bg-white dark:bg-[#0F1117]',
        text: 'text-slate-900 dark:text-white',
        textMuted: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-white/10',
        cardBg: 'bg-white dark:bg-[#1A1D24]',
        iconColor: 'text-indigo-600 dark:text-indigo-400'
    };

    if (!mounted) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    GitHub Upload Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your content uploads to the GitHub repository.
                </p>
            </div>

            {/* Warning Alert */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <span className="font-bold">Warning:</span> Hanya digunakan jika mengalami gagal upload ketika menambahkan lagu di addmusic page. Halaman upload ini hanya dilakukan jika urgent saja dan tidak dibenarkan upload gambar dan canvas dari sini dikarenakan untuk menghapus dari github itu sangat ketat.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Content Upload */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-[#0F1117] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                        <FileVideo className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Upload Content
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        Upload poster covers (max 4MB) and canvas videos (MP4, max 6MB).
                    </p>
                    <button
                        onClick={() => { setActiveModal('content'); setContentType('cover'); }}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Media
                    </button>
                </motion.div>

                {/* Card 2: Artist Profile Upload */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white dark:bg-[#0F1117] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                        <User className="h-6 w-6" />
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Upload Artist Profile
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        Update artist profile photos. Uploaded images will be synced to the GitHub repository.
                    </p>
                    <button
                        onClick={() => setActiveModal('artist')}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Profile
                    </button>
                </motion.div>
            </div>

            {/* --- MODAL WRAPPER --- */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !isUploading) {
                                resetModals();
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-[#161922] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {activeModal === 'artist' ? <User size={18} className="text-emerald-500" /> : <FileVideo size={18} className="text-indigo-500" />}
                                    {activeModal === 'artist' ? 'Upload Artist Photo' : 'Upload Content'}
                                </h3>
                                {!isUploading && (
                                    <button onClick={resetModals} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* CONTENT UPLOAD TABS */}
                            {activeModal === 'content' && !uploadedUrl && !isUploading && (
                                <div className="grid grid-cols-2 gap-3 mx-6 mt-6">
                                    <button
                                        onClick={() => { setContentType('cover'); setContentFile(null); setContentPreviewUrl(null); }}
                                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${contentType === 'cover'
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:border-indigo-200 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${contentType === 'cover' ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-white/5'
                                            }`}>
                                            <ImageIcon size={16} />
                                        </div>
                                        <span className="text-sm font-bold">Cover (Image)</span>
                                    </button>

                                    <button
                                        onClick={() => { setContentType('canvas'); setContentFile(null); setContentPreviewUrl(null); }}
                                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${contentType === 'canvas'
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:border-indigo-200 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${contentType === 'canvas' ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-white/5'
                                            }`}>
                                            <Video size={16} />
                                        </div>
                                        <span className="text-sm font-bold">Canvas (Video)</span>
                                    </button>
                                </div>
                            )}

                            <div className="p-6 space-y-6">
                                {/* 1. STATE: INITIAL / PREVIEW */}
                                {!uploadedUrl && !isUploading && (
                                    <>
                                        <div className="space-y-4">
                                            {/* Preview Area */}
                                            <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white/5 relative group overflow-hidden">

                                                {/* Dynamic Preview Logic */}
                                                {(activeModal === 'artist' ? artistPreviewUrl : contentPreviewUrl) ? (
                                                    <div className="relative w-full h-full flex items-center justify-center p-4">
                                                        {/* Image Preview */}
                                                        {(activeModal === 'artist' || contentType === 'cover') && (
                                                            <img src={activeModal === 'artist' ? artistPreviewUrl : contentPreviewUrl} alt="Preview" className="max-h-48 rounded-lg shadow-lg" />
                                                        )}
                                                        {/* Video Preview */}
                                                        {(activeModal === 'content' && contentType === 'canvas') && (
                                                            <video src={contentPreviewUrl} controls className="max-h-48 rounded-lg shadow-lg w-full" />
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                if (activeModal === 'artist') {
                                                                    if (artistPreviewUrl) URL.revokeObjectURL(artistPreviewUrl);
                                                                    setArtistFile(null);
                                                                    setArtistPreviewUrl(null);
                                                                }
                                                                else {
                                                                    if (contentPreviewUrl) URL.revokeObjectURL(contentPreviewUrl);
                                                                    setContentFile(null);
                                                                    setContentPreviewUrl(null);
                                                                }
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* Empty State */
                                                    <div className="text-center p-6">
                                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-3">
                                                            {activeModal === 'content' && contentType === 'canvas' ? <Video size={24} /> : <ImageIcon size={24} />}
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                            Drag & drop or Click to upload
                                                        </p>
                                                        <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                                                            {activeModal === 'content' && contentType === 'canvas' ? (
                                                                <>
                                                                    <p>Supports: MP4 (Max 6MB)</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p>Supports: JPG, PNG ({activeModal === 'content' ? 'Max 4MB' : 'No size limit'})</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* File Input */}
                                                {!(activeModal === 'artist' ? artistPreviewUrl : contentPreviewUrl) && (
                                                    <input
                                                        type="file"
                                                        accept={activeModal === 'content' && contentType === 'canvas' ? "video/mp4" : "image/*"}
                                                        onChange={(e) => handleFileChange(e, activeModal === 'artist' ? 'artist' : (contentType === 'cover' ? 'cover' : 'canvas'))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {!(activeModal === 'content' && contentType === 'canvas') && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handlePaste(activeModal === 'artist' ? 'artist' : 'cover')}
                                                        className="flex-1 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                                    >
                                                        <Clipboard size={16} />
                                                        Paste Image
                                                    </button>
                                                </div>
                                            )}

                                            {/* Error Message */}
                                            {uploadError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-500/20">
                                                    {uploadError}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        {(activeModal === 'artist' ? artistFile : contentFile) && (
                                            <button
                                                onClick={() => handleUpload(activeModal)}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Upload size={18} />
                                                Upload to GitHub
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* 2. STATE: UPLOADING */}
                                {isUploading && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white">Uploading...</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Pushing to GitHub...</p>
                                        </div>
                                    </div>
                                )}

                                {/* 3. STATE: SUCCESS */}
                                {uploadedUrl && !isUploading && (
                                    <div className="flex flex-col items-center justify-center py-4 space-y-6 text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                                            <Check size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Upload Successful!</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
                                                Your file has been uploaded.
                                            </p>
                                        </div>

                                        <div className="w-full bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-3">
                                            <div className="flex-1 truncate text-xs font-mono text-slate-600 dark:text-slate-300 text-left">
                                                {uploadedUrl}
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(uploadedUrl)}
                                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
                                                title="Copy URL"
                                            >
                                                <Clipboard size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={resetModals}
                                            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- CROPPER MODAL (Reused) --- */}
            {isCropperOpen && (
                <ImageCropperModal
                    imageSrc={croppingImage}
                    aspect={1}
                    onCropComplete={handleCropComplete}
                    onClose={() => { setIsCropperOpen(false); setCroppingImage(null); setCroppingType(null); }}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default GithubUploadPage;
