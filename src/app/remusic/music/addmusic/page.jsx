"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2, Sun, Moon, Upload } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';
import { useTheme } from 'next-themes';

// Import Komponen Modular
import { uploadToGithub, parseLrc, getAudioDuration, formatTimestamp } from './_utils/uploadHelpers';
import ArtistSelector from './_components/ArtistSelector';
import FileUploadSection from './_components/FileUploadSection';
import MetadataForm from './_components/MetadataForm';
import VisualSyncEditor from './_components/VisualSyncEditor';
import ImageCropperModal from './_components/ImageCropperModal';
import MetadataLoadingModal from './_components/MetadataLoadingModal';

export default function UploadSongPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Wait for mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted ? resolvedTheme === 'dark' : true; // Default to dark if not mounted yet or prefer dark

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);

    // --- FORM STATES ---
    const [title, setTitle] = useState("");
    const [language, setLanguage] = useState("id");
    const [moods, setMoods] = useState([]);
    const [lyricsRaw, setLyricsRaw] = useState("");
    const [telegramFileId, setTelegramFileId] = useState("");
    const [telegramDuration, setTelegramDuration] = useState(0);

    // --- ARTIST STATES ---
    const [artists, setArtists] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [artistSearchTerm, setArtistSearchTerm] = useState("");
    const [isCreatingArtist, setIsCreatingArtist] = useState(false);
    const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
    // New Artist Form
    const [newArtistName, setNewArtistName] = useState("");
    const [newArtistDesc, setNewArtistDesc] = useState("");
    const [newArtistPhoto, setNewArtistPhoto] = useState(null);
    const [newArtistPhotoPreview, setNewArtistPhotoPreview] = useState(null);

    // --- FILE STATES ---
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [canvasFile, setCanvasFile] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

    // --- PLAYER STATES ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
    const [syncIndex, setSyncIndex] = useState(0);

    // --- CROPPER STATES ---
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [croppingImage, setCroppingImage] = useState(null);
    const [croppingType, setCroppingType] = useState(null); // 'cover' | 'artist'

    // --- EFFECTS: FETCH ARTISTS ---
    useEffect(() => {
        const fetchArtists = async () => {
            const { data } = await supabase.from('artists').select('id, name, photo_url, description').order('name');
            setArtists(data || []);
        };
        fetchArtists();

        return () => {
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            if (newArtistPhotoPreview) URL.revokeObjectURL(newArtistPhotoPreview);
        }
    }, []);

    // -------------------------------------------------------------------------
    // 🔥 FITUR BARU: AUTO PREVIEW TELEGRAM ID
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!telegramFileId || telegramFileId.length < 20) return; // Minimal length disesuaikan

        const delayDebounceFn = setTimeout(async () => {
            console.log("🔍 Mendeteksi Telegram ID...");

            try {
                // Request ke API
                const response = await fetch(`/api/get-stream-url?file_id=${telegramFileId}`);
                const data = await response.json();

                if (data.success && data.url) {
                    console.log("✅ Stream URL Didapat:", data.url);

                    // 1. Set URL ke Player
                    setAudioPreviewUrl(data.url);
                    setAudioFile(null); // Reset file manual

                    // 2. 🔥 AMBIL DURASI DARI STREAM URL (INVISIBLE AUDIO)
                    // Kita buat objek audio sementara di background cuma buat intip durasi
                    const tempAudio = new Audio(data.url);

                    tempAudio.onloadedmetadata = () => {
                        if (isFinite(tempAudio.duration)) {
                            const durMs = Math.round(tempAudio.duration * 1000);
                            setTelegramDuration(durMs);
                            console.log("✅ Durasi Telegram Terdeteksi:", durMs, "ms");
                        }
                    };

                    // Hapus object audio kalau error/selesai biar hemat memori
                    tempAudio.onerror = () => console.warn("Gagal baca metadata durasi stream");

                    // 3. Extract Metadata from URL
                    await fetchMetadata(data.url, 'url');

                } else {
                    console.warn("❌ Gagal mendapatkan link:", data.error);
                    setAudioPreviewUrl(null);
                    setTelegramDuration(0);
                }
            } catch (error) {
                console.error("Error fetching stream:", error);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [telegramFileId]);
    // -------------------------------------------------------------------------


    // --- HANDLERS ---
    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    // Helper to fetch metadata
    const fetchMetadata = async (source, type) => {
        setIsMetadataLoading(true);
        try {
            let body;
            let headers = {};

            if (type === 'file') {
                const formData = new FormData();
                formData.append('file', source);
                body = formData;
            } else {
                body = JSON.stringify({ url: source });
                headers = { 'Content-Type': 'application/json' };
            }

            const res = await fetch('/api/extract-metadata', {
                method: 'POST',
                headers,
                body
            });

            const data = await res.json();
            if (data.success) {
                console.log("Metadata extracted:", data);
                if (data.title) setTitle(data.title);
                if (data.artist) {
                    setArtistSearchTerm(data.artist);
                    // Also pre-fill new artist name just in case
                    setNewArtistName(data.artist);
                }
                if (data.cover) {
                    try {
                        // Convert base64 to File
                        const byteString = atob(data.cover.data);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], { type: data.cover.mime });
                        // Ensure filename has extension
                        const ext = data.cover.mime.split('/')[1] || 'jpg';
                        const file = new File([blob], `extracted_cover.${ext}`, { type: data.cover.mime });

                        setCoverFile(file);
                        setCoverPreviewUrl(URL.createObjectURL(file));
                    } catch (e) {
                        console.error("Error processing cover image:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to extract metadata:", error);
        } finally {
            setIsMetadataLoading(false);
        }
    };

    const handleNewArtistPhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageDataUrl = await readFile(file);
            setCroppingImage(imageDataUrl);
            setCroppingType('artist');
            setIsCropperOpen(true);
            e.target.value = null; // Reset input
        }
    };

    const handleAudioChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            setAudioPreviewUrl(URL.createObjectURL(file));
            // Kosongkan Telegram ID kalau user upload file manual (biar gak bentrok)
            setTelegramFileId("");

            // Extract Metadata
            await fetchMetadata(file, 'file');
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageDataUrl = await readFile(file);
            setCroppingImage(imageDataUrl);
            setCroppingType('cover');
            setIsCropperOpen(true);
            e.target.value = null; // Reset input
        }
    };

    const handleCropComplete = (croppedBlob) => {
        if (croppingType === 'cover') {
            // Create a File object from Blob
            const file = new File([croppedBlob], "cover_cropped.jpg", { type: "image/jpeg" });
            setCoverFile(file);
            setCoverPreviewUrl(URL.createObjectURL(croppedBlob));
        } else if (croppingType === 'artist') {
            const file = new File([croppedBlob], "artist_cropped.jpg", { type: "image/jpeg" });
            setNewArtistPhoto(file);
            setNewArtistPhotoPreview(URL.createObjectURL(croppedBlob));
        }
        setIsCropperOpen(false);
        setCroppingImage(null);
        setCroppingType(null);
    };

    const handleCanvasChange = (e) => setCanvasFile(e.target.files[0]);

    const handleMoodToggle = (mood) => {
        if (moods.includes(mood)) setMoods(moods.filter(m => m !== mood));
        else setMoods([...moods, mood]);
    };

    const handleLyricsChange = (e) => {
        setLyricsRaw(e.target.value);
        setParsedLyrics(parseLrc(e.target.value));
        setSyncIndex(0);
    };

    const handleTapSync = () => {
        const updated = [...parsedLyrics];
        if (!updated[syncIndex]) return;

        updated[syncIndex] = { ...updated[syncIndex], time: currentTime, original: `${formatTimestamp(currentTime)} ${updated[syncIndex].text}` };
        setParsedLyrics(updated);
        setLyricsRaw(updated.map(l => l.original).join('\n'));
        if (syncIndex < parsedLyrics.length - 1) setSyncIndex(p => p + 1);
    };

    const skipTime = (audioRef, seconds) => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds);
    }

    // --- MAIN UPLOAD LOGIC ---
    const handleUpload = async (e) => {
        e.preventDefault();

        // VALIDASI
        if (!title.trim()) return alert("Judul lagu wajib diisi.");
        if (!coverFile) return alert("Cover image lagu wajib ada.");
        // Audio Wajib: Entah dari File ATAU Telegram ID
        if (!audioFile && !telegramFileId) return alert("Wajib isi Audio File atau Telegram File ID.");

        if (!isCreatingArtist && !selectedArtist) return alert("Pilih artis yang sudah ada atau buat artis baru.");
        if (isCreatingArtist) {
            if (!newArtistName.trim()) return alert("Nama artis baru wajib diisi.");
            if (!newArtistPhoto) return alert("Foto artis baru wajib diupload.");
        }

        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not logged in");

            let finalArtistId = selectedArtist?.id;

            // 1. HANDLE NEW ARTIST
            if (isCreatingArtist) {
                setUploadStep("Mendaftarkan Artis Baru...");
                const newArtistId = crypto.randomUUID();

                setUploadStep("Mengunggah Foto Artis...");
                const artistPhotoUrl = await uploadToGithub(newArtistPhoto, newArtistId, 'artist_photo');

                setUploadStep("Menyimpan Data Artis...");
                const { error: artistErr } = await supabase.from('artists').insert({
                    id: newArtistId, name: newArtistName, description: newArtistDesc,
                    photo_url: artistPhotoUrl, created_by: user.id
                });

                if (artistErr) throw artistErr;
                finalArtistId = newArtistId;
            }

            // 2. HANDLE SONG FILES
            const songId = crypto.randomUUID();
            let finalAudioUrl = "";
            let durationMs = 0;
            let finalDurationMs = 0;

            // Cek apakah pakai File Manual atau Telegram
            if (audioFile) {
                setUploadStep("Menghitung durasi (Local File)...");
                durationMs = await getAudioDuration(audioFile);

                setUploadStep("Mengunggah Audio ke Supabase...");
                const audioExt = audioFile.name.split('.').pop();
                const audioPath = `songs/${songId}.${audioExt}`;
                const { error: audioErr } = await supabase.storage.from('songs').upload(audioPath, audioFile);
                if (audioErr) throw audioErr;
                const { data: audioUrlData } = supabase.storage.from('songs').getPublicUrl(audioPath);
                finalAudioUrl = audioUrlData.publicUrl;
            } else if (telegramFileId) {
                setUploadStep("Menggunakan Telegram Audio...");

                // 🔥 Ambil durasi dari state yang sudah dihitung oleh useEffect tadi
                if (telegramDuration > 0) {
                    finalDurationMs = telegramDuration;
                } else {
                    // Fallback kalau gagal detect (misal koneksi lambat), coba ambil manual/0
                    console.warn("Durasi telegram belum terdeteksi, menyimpan 0");
                    finalDurationMs = 0;
                }
            }

            setUploadStep("Mengunggah Cover Lagu ke GitHub...");
            const githubCoverUrl = await uploadToGithub(coverFile, songId, 'cover');

            let githubCanvasUrl = null;
            if (canvasFile) {
                setUploadStep("Mengunggah Canvas ke GitHub...");
                githubCanvasUrl = await uploadToGithub(canvasFile, songId, 'canvas');
            }

            // 3. INSERT SONG DB
            setUploadStep("Menyimpan Metadata Lagu...");
            const { error: dbError } = await supabase.from('songs').insert({
                id: songId, title: title, artist_id: finalArtistId, uploader_user_id: user.id,
                audio_url: finalAudioUrl || null, // Kosong jika pakai Telegram
                telegram_audio_file_id: telegramFileId || null,
                cover_url: githubCoverUrl, canvas_url: githubCanvasUrl,
                lyrics: lyricsRaw, duration_ms: finalDurationMs, moods: moods,
                language: language,
                play_count: 0, like_count: 0
            });

            if (dbError) throw dbError;

            setUploadStep("Selesai!");
            alert("Lagu berhasil dipublish!");
            router.push('/remusic/music');

        } catch (error) {
            console.error("Upload Error:", error);
            alert(`Gagal upload: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadStep("");
        }
    };

    const theme = isDarkMode
        ? { bg: 'bg-[#081028]', text: 'text-white', textMuted: 'text-slate-400', border: 'border-slate-800', cardBg: 'bg-[#0f172a]', inputBg: 'bg-[#1e293b]', iconColor: 'text-indigo-400', scrollHide: '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', hover: 'hover:bg-slate-800', targetRow: 'border-emerald-500 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]', activeRow: 'bg-indigo-900/40 border-indigo-500/50' }
        : { bg: 'bg-white', text: 'text-slate-900', textMuted: 'text-slate-500', border: 'border-slate-200', cardBg: 'bg-slate-50', inputBg: 'bg-white', iconColor: 'text-blue-600', scrollHide: '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', hover: 'hover:bg-slate-100', targetRow: 'border-emerald-500 bg-emerald-50 shadow-sm', activeRow: 'bg-blue-50 border-blue-400' };

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans flex flex-col`}>
            {/* HEADER */}
            <div className={`flex justify-between items-center px-4 md:px-8 py-4 border-b ${theme.border} sticky top-0 z-50 ${theme.bg}/95 backdrop-blur-sm`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className={`p-2 rounded-full hover:bg-white/10 ${theme.textMuted}`}><X size={24} /></button>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/10' : 'bg-blue-100'}`}><Upload className={theme.iconColor} size={20} /></div>
                        <h1 className="text-xl font-bold tracking-tight hidden md:block">Upload New Song</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle button removed, theme is now automatic */}
                    <button onClick={handleUpload} disabled={isUploading} className={`hidden md:flex px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg items-center gap-2 transition-all ${isUploading ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}>
                        {isUploading ? <><Loader2 className="animate-spin" size={16} /> {uploadStep || "Uploading..."}</> : <><Save size={16} /> Publish</>}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-73px)]">
                {/* LEFT COLUMN: Inputs */}
                <div className={`w-full lg:w-[35%] flex flex-col border-b lg:border-b-0 lg:border-r ${theme.border} ${theme.scrollHide} overflow-y-auto`}>
                    <div className="p-6 space-y-8">
                        <FileUploadSection
                            theme={theme}
                            handleAudioChange={handleAudioChange} telegramFileId={telegramFileId} setTelegramFileId={setTelegramFileId}
                            coverPreviewUrl={coverPreviewUrl} handleCoverChange={handleCoverChange}
                            handleCanvasChange={handleCanvasChange}
                        />

                        <ArtistSelector
                            theme={theme}
                            artists={artists} selectedArtist={selectedArtist} setSelectedArtist={setSelectedArtist}
                            isCreatingArtist={isCreatingArtist} setIsCreatingArtist={setIsCreatingArtist}
                            artistSearchTerm={artistSearchTerm} setArtistSearchTerm={setArtistSearchTerm}
                            isDropdownOpen={isArtistDropdownOpen} setIsDropdownOpen={setIsArtistDropdownOpen}
                            newArtistName={newArtistName} setNewArtistName={setNewArtistName}
                            newArtistDesc={newArtistDesc} setNewArtistDesc={setNewArtistDesc}
                            newArtistPhotoPreview={newArtistPhotoPreview} handleNewArtistPhotoChange={handleNewArtistPhotoChange}
                        />

                        <MetadataForm
                            theme={theme}
                            title={title} setTitle={setTitle} language={language} setLanguage={setLanguage}
                            moods={moods} handleMoodToggle={handleMoodToggle}
                            lyricsRaw={lyricsRaw} handleLyricsChange={handleLyricsChange}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Visual Editor */}
                <VisualSyncEditor
                    theme={theme} isDarkMode={isDarkMode}
                    title={title} selectedArtist={selectedArtist} newArtistName={newArtistName} isCreatingArtist={isCreatingArtist}
                    coverPreviewUrl={coverPreviewUrl} audioPreviewUrl={audioPreviewUrl}
                    isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                    currentTime={currentTime} setCurrentTime={setCurrentTime}
                    parsedLyrics={parsedLyrics} syncIndex={syncIndex} setSyncIndex={setSyncIndex}
                    activeLyricIndex={activeLyricIndex} setActiveLyricIndex={setActiveLyricIndex}
                    handleTapSync={handleTapSync} skipTime={skipTime}
                />
            </div>

            {/* Mobile Save Button */}
            <div className={`md:hidden p-4 border-t ${theme.border} ${theme.bg} sticky bottom-0 z-50`}>
                <div className="text-xs opacity-50 text-center mb-2">{uploadStep || "Ready to upload"}</div>
                <button onClick={handleUpload} disabled={isUploading} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${isUploading ? 'bg-slate-600' : 'bg-indigo-600 active:scale-95'}`}>
                    {isUploading ? <><Loader2 className="animate-spin" size={16} /> Uploading...</> : <><Save size={18} /> Publish Song</>}
                </button>
            </div>

            {/* CROPPER MODAL */}
            {isCropperOpen && (
                <ImageCropperModal
                    imageSrc={croppingImage}
                    aspect={1}
                    onCropComplete={handleCropComplete}
                    onClose={() => { setIsCropperOpen(false); setCroppingImage(null); }}
                    theme={theme}
                />
            )}

            {/* METADATA LOADING MODAL */}
            {isMetadataLoading && <MetadataLoadingModal theme={theme} />}
        </div>
    );
}