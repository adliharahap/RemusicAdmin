"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2, Sun, Moon, Upload } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';
import { useTheme } from 'next-themes';

// Import Komponen Modular
import { uploadToGithub, getAudioDuration } from './_utils/uploadHelpers';
import ArtistSelector from './_components/ArtistSelector';
import FileUploadSection from './_components/FileUploadSection';
import MetadataForm from './_components/MetadataForm';
import AudioPreviewPlayer from './_components/AudioPreviewPlayer';
import ImageCropperModal from './_components/ImageCropperModal';
import MetadataLoadingModal from './_components/MetadataLoadingModal';
import UploadStatusModal from './_components/UploadStatusModal';

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
    // const [uploadStep, setUploadStep] = useState(""); // Diganti dengan Modal Steps
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);

    // --- UPLOAD MODAL STATES ---
    const [uploadSteps, setUploadSteps] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploadCompleted, setIsUploadCompleted] = useState(false);

    // --- FORM STATES ---
    const [title, setTitle] = useState("");
    const [language, setLanguage] = useState("id");
    const [moods, setMoods] = useState([]);
    const [featuredArtists, setFeaturedArtists] = useState([]);
    const [lyricsRaw, setLyricsRaw] = useState("");
    const [telegramFileId, setTelegramFileId] = useState("");
    const [telegramDuration, setTelegramDuration] = useState(0);
    const [localDuration, setLocalDuration] = useState(0);

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

    // --- PLAYER STATES (REMOVED SYNC) ---
    // isPlaying, currentTime, dst. dihapus karena VisualSyncEditor tidak dipakai lagi

    // --- CROPPER STATES ---
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [croppingImage, setCroppingImage] = useState(null);
    const [croppingType, setCroppingType] = useState(null); // 'cover' | 'artist'

    // --- DIRTY STATE REF ---
    const isDirtyRef = useRef(false);
    const isCompletedRef = useRef(false);

    useEffect(() => {
        isCompletedRef.current = isUploadCompleted;
    }, [isUploadCompleted]);

    useEffect(() => {
        isDirtyRef.current = !!(title || audioFile || coverFile || telegramFileId || newArtistName || isCreatingArtist || lyricsRaw || featuredArtists.length > 0);
    }, [title, audioFile, coverFile, telegramFileId, newArtistName, isCreatingArtist, lyricsRaw, featuredArtists]);

    // --- PREVENT ACCIDENTAL EXIT ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current && !isCompletedRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Pushing state to trap Android back button / Browser back button
        window.history.pushState(null, '', window.location.href);
        const handlePopState = (e) => {
            if (isDirtyRef.current && !isCompletedRef.current) {
                if (window.confirm("Apakah anda yakin ingin keluar? Data yang sudah diisi akan hilang.")) {
                    isDirtyRef.current = false;
                    window.history.back();
                } else {
                    window.history.pushState(null, '', window.location.href);
                }
            } else {
                window.history.back();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []); // Run ONLY once on mount

    const handleBackClick = () => {
        if (isDirtyRef.current && !isCompletedRef.current) {
            if (window.confirm("Apakah anda yakin ingin keluar? Data yang sudah diisi akan hilang.")) {
                isDirtyRef.current = false;
                // Pop the dummy state then go back
                window.history.back();
            }
        } else {
            // Pop the dummy state then go back
            window.history.back();
        }
    };

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
    // -------------------------------------------------------------------------
    // 🔥 FITUR BARU: AUTO EXTRACT METADATA FROM TELEGRAM ID
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!telegramFileId || telegramFileId.length < 20) return;

        const delayDebounceFn = setTimeout(async () => {
            console.log("🔍 Extracting Metadata from Telegram ID...");
            setIsMetadataLoading(true);

            try {
                // Call extract-metadata directly with file_id
                const res = await fetch('/api/extract-metadata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_id: telegramFileId })
                });

                const data = await res.json();

                if (data.success) {
                    console.log("✅ Metadata Extracted:", data);
                    if (data.title) setTitle(data.title);
                    if (data.artists && data.artists.length > 0) {
                        console.log("Found Array of Artists:", data.artists);
                        setArtistSearchTerm(data.artists[0]);
                        setNewArtistName(data.artists[0]);
                        if (data.artists.length > 1) {
                            console.log("Setting Featured Artists:", data.artists.slice(1));
                            setFeaturedArtists(data.artists.slice(1));
                        }
                    } else if (data.artist) {
                        console.log("Found Single Artist String:", data.artist);
                        setArtistSearchTerm(data.artist);
                        setNewArtistName(data.artist);
                    }
                    if (data.duration) {
                        setTelegramDuration(data.duration);
                        console.log("✅ Duration Extracted:", data.duration, "ms");
                    }
                    if (data.cover) {
                        try {
                            const byteString = atob(data.cover.data);
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                            }
                            const blob = new Blob([ab], { type: data.cover.mime });
                            const ext = data.cover.mime.split('/')[1] || 'jpg';
                            const file = new File([blob], `extracted_cover.${ext}`, { type: data.cover.mime });

                            setCoverFile(file);
                            setCoverPreviewUrl(URL.createObjectURL(file));
                        } catch (e) {
                            console.error("Error processing cover image:", e);
                        }
                    }

                    // Fetch stream URL for preview
                    try {
                        const streamRes = await fetch(`/api/get-stream-url?song_id=preview_${telegramFileId}&file_id=${telegramFileId}`);
                        if (streamRes.ok) {
                            const streamData = await streamRes.json();
                            if (streamData.success && streamData.url) {
                                setAudioPreviewUrl(streamData.url);
                            }
                        }
                    } catch (e) {
                        console.error("Error fetching preview stream:", e);
                    }
                } else {
                    console.warn("❌ Failed to extract metadata:", data.error);
                }
            } catch (error) {
                console.error("Error extracting metadata:", error);
            } finally {
                setIsMetadataLoading(false);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [telegramFileId]);
    // -------------------------------------------------------------------------
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
                if (data.artists && data.artists.length > 0) {
                    console.log("Found Array of Artists:", data.artists);
                    setArtistSearchTerm(data.artists[0]);
                    setNewArtistName(data.artists[0]);
                    if (data.artists.length > 1) {
                        console.log("Setting Featured Artists:", data.artists.slice(1));
                        setFeaturedArtists(data.artists.slice(1));
                    }
                } else if (data.artist) {
                    console.log("Found Single Artist String:", data.artist);
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

    const handleNewArtistPhotoChange = async (eOrFile) => {
        let file;
        if (eOrFile.target) {
            file = eOrFile.target.files[0];
            eOrFile.target.value = null; // Reset input
        } else {
            file = eOrFile;
        }

        if (file) {
            const imageDataUrl = await readFile(file);
            setCroppingImage(imageDataUrl);
            setCroppingType('artist');
            setIsCropperOpen(true);
        }
    };

    const handleAudioChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            setAudioPreviewUrl(URL.createObjectURL(file));
            // Kosongkan Telegram ID kalau user upload file manual (biar gak bentrok)
            setTelegramFileId("");

            // Calculate Duration
            const dur = await getAudioDuration(file);
            setLocalDuration(dur);

            // Extract Metadata
            await fetchMetadata(file, 'file');
        }
    };

    const handleCoverChange = async (eOrFile) => {
        let file;
        if (eOrFile.target) {
            file = eOrFile.target.files[0];
            eOrFile.target.value = null; // Reset input
        } else {
            file = eOrFile;
        }

        if (file) {
            const imageDataUrl = await readFile(file);
            setCroppingImage(imageDataUrl);
            setCroppingType('cover');
            setIsCropperOpen(true);
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
    };

    // --- MAIN UPLOAD LOGIC (REFACTORED) ---
    const handleUpload = async (e) => {
        e.preventDefault();

        // 1. VALIDASI INPUT
        if (!title.trim()) return alert("Judul lagu wajib diisi.");
        if (!coverFile) return alert("Cover image lagu wajib ada.");
        if (!audioFile && !telegramFileId) return alert("Wajib isi Audio File atau Telegram File ID.");

        if (!isCreatingArtist && !selectedArtist) return alert("Pilih artis yang sudah ada atau buat artis baru.");
        if (isCreatingArtist) {
            if (!newArtistName.trim()) return alert("Nama artis baru wajib diisi.");
            if (!newArtistPhoto) return alert("Foto artis baru wajib diupload.");
        }

        // 2. PERSIAPAN STEPS
        const steps = [];

        // Step Artist
        if (isCreatingArtist) {
            steps.push({ id: 'artist_db', label: 'Mendaftarkan Artis Baru (Database)', status: 'pending' });
            steps.push({ id: 'artist_upload', label: 'Mengunggah Foto Artis', status: 'pending' });
        }

        // Step Song DB
        steps.push({ id: 'song_db', label: 'Menyimpan Metadata Lagu (Database)', status: 'pending' });

        // Step Files Upload
        if (audioFile) steps.push({ id: 'audio_upload', label: 'Mengunggah File Audio', status: 'pending' });
        steps.push({ id: 'cover_upload', label: 'Mengunggah Cover Lagu', status: 'pending' });
        if (canvasFile) steps.push({ id: 'canvas_upload', label: 'Mengunggah Canvas', status: 'pending' });

        setUploadSteps(steps);
        setShowUploadModal(true);
        setIsUploading(true);
        setIsUploadCompleted(false);

        // Helper untuk update status step
        const updateStepStatus = (id, status, error = null) => {
            setUploadSteps(prev => prev.map(s => s.id === id ? { ...s, status, error } : s));
        };

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not logged in");

            let finalArtistId = selectedArtist?.id;
            const songId = crypto.randomUUID();

            // ---------------------------------------------------------
            // 3. EKSEKUSI: ARTIST DB (Jika Baru)
            // ---------------------------------------------------------
            if (isCreatingArtist) {
                updateStepStatus('artist_db', 'loading');
                const newArtistId = crypto.randomUUID();

                // Insert Artist dengan photo_url NULL dulu (atau placeholder)
                const { error: artistErr } = await supabase.from('artists').insert({
                    id: newArtistId,
                    name: newArtistName,
                    description: newArtistDesc,
                    photo_url: null, // Akan diupdate setelah upload
                    created_by: user.id
                });

                if (artistErr) {
                    updateStepStatus('artist_db', 'error', artistErr.message);
                    throw artistErr;
                }

                finalArtistId = newArtistId;
                updateStepStatus('artist_db', 'success');
            }

            // ---------------------------------------------------------
            // 4. EKSEKUSI: SONG DB
            // ---------------------------------------------------------
            updateStepStatus('song_db', 'loading');

            // Hitung durasi dulu jika perlu (ini cepat jadi bisa digabung step DB)
            let finalDurationMs = 0;
            if (audioFile) {
                finalDurationMs = await getAudioDuration(audioFile);
            } else if (telegramFileId) {
                finalDurationMs = telegramDuration > 0 ? telegramDuration : 0;
            }

            // Insert Song dengan URL NULL dulu
            const { error: dbError } = await supabase.from('songs').insert({
                id: songId,
                title: title,
                artist_id: finalArtistId,
                featured_artists: featuredArtists,
                uploader_user_id: user.id,
                audio_url: null,
                telegram_audio_file_id: telegramFileId || null,
                cover_url: null, // Update nanti
                canvas_url: null, // Update nanti
                lyrics: lyricsRaw,
                duration_ms: finalDurationMs,
                moods: moods,
                language: language,
                play_count: 0,
                like_count: 0
            });

            if (dbError) {
                updateStepStatus('song_db', 'error', dbError.message);
                throw dbError;
            }
            updateStepStatus('song_db', 'success');

            // ---------------------------------------------------------
            // 5. EKSEKUSI: UPLOAD FILES & UPDATE DB
            // ---------------------------------------------------------

            // A. UPLOAD ARTIST PHOTO (Jika Baru)
            if (isCreatingArtist) {
                updateStepStatus('artist_upload', 'loading');
                try {
                    const artistPhotoUrl = await uploadToGithub(newArtistPhoto, finalArtistId, 'artist_photo');

                    // Update DB
                    await supabase.from('artists').update({ photo_url: artistPhotoUrl }).eq('id', finalArtistId);

                    updateStepStatus('artist_upload', 'success');
                } catch (err) {
                    console.error(err);
                    updateStepStatus('artist_upload', 'error', "Gagal upload foto artis, tapi data artis tersimpan.");
                    // Kita tidak throw error di sini agar proses lain tetap lanjut? 
                    // User minta "dipisah pisah apa yang berhasil dan apa yang gagal".
                    // Jadi kita lanjut ke file lagu.
                }
            }

            // B. UPLOAD AUDIO (Supabase)
            if (audioFile) {
                updateStepStatus('audio_upload', 'loading');
                try {
                    const audioExt = audioFile.name.split('.').pop();
                    const audioPath = `songs/${songId}.${audioExt}`;
                    const { error: audioErr } = await supabase.storage.from('songs').upload(audioPath, audioFile);
                    if (audioErr) throw audioErr;

                    const { data: audioUrlData } = supabase.storage.from('songs').getPublicUrl(audioPath);
                    const finalAudioUrl = audioUrlData.publicUrl;

                    // Update DB
                    await supabase.from('songs').update({ audio_url: finalAudioUrl }).eq('id', songId);

                    updateStepStatus('audio_upload', 'success');
                } catch (err) {
                    console.error(err);
                    updateStepStatus('audio_upload', 'error', "Gagal upload audio.");
                }
            }

            // C. UPLOAD COVER (GitHub)
            updateStepStatus('cover_upload', 'loading');
            try {
                const githubCoverUrl = await uploadToGithub(coverFile, songId, 'cover');

                // Update DB
                await supabase.from('songs').update({ cover_url: githubCoverUrl }).eq('id', songId);

                updateStepStatus('cover_upload', 'success');
            } catch (err) {
                console.error(err);
                updateStepStatus('cover_upload', 'error', "Gagal upload cover.");
            }

            // D. UPLOAD CANVAS (GitHub) - Optional
            if (canvasFile) {
                updateStepStatus('canvas_upload', 'loading');
                try {
                    const githubCanvasUrl = await uploadToGithub(canvasFile, songId, 'canvas');

                    // Update DB
                    await supabase.from('songs').update({ canvas_url: githubCanvasUrl }).eq('id', songId);

                    updateStepStatus('canvas_upload', 'success');
                } catch (err) {
                    console.error(err);
                    updateStepStatus('canvas_upload', 'error', "Gagal upload canvas.");
                }
            }

            setIsUploadCompleted(true);
            // Jangan redirect otomatis biar user lihat status dulu
            // router.push('/remusic/music'); 

        } catch (error) {
            console.error("Critical Upload Error:", error);
            // Error critical (biasanya di step DB) sudah di-handle di updateStepStatus masing-masing
        } finally {
            setIsUploading(false);
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
                    <button onClick={handleBackClick} className={`p-2 rounded-full hover:bg-white/10 ${theme.textMuted}`}><X size={24} /></button>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/10' : 'bg-blue-100'}`}><Upload className={theme.iconColor} size={20} /></div>
                        <h1 className="text-xl font-bold tracking-tight hidden md:block">Upload New Song</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle button removed, theme is now automatic */}
                    <button onClick={handleUpload} disabled={isUploading} className={`hidden md:flex px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg items-center gap-2 transition-all ${isUploading ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}>
                        {isUploading ? <><Loader2 className="animate-spin" size={16} /> Uploading...</> : <><Save size={16} /> Publish</>}
                    </button>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto ${theme.scrollHide} p-4 md:p-6 lg:p-8`}>
                <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">

                    {/* LEFT COLUMN: Upload & Artist (Bigger width on lg, sticky maybe) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-8 lg:pb-8">

                        <AudioPreviewPlayer
                            theme={theme}
                            audioFile={audioFile}
                            audioPreviewUrl={audioPreviewUrl}
                            telegramFileId={telegramFileId}
                            title={title}
                            selectedArtist={selectedArtist}
                            newArtistName={newArtistName}
                            isCreatingArtist={isCreatingArtist}
                            coverPreviewUrl={coverPreviewUrl}
                        />

                        <FileUploadSection
                            theme={theme}
                            handleAudioChange={handleAudioChange} telegramFileId={telegramFileId} setTelegramFileId={setTelegramFileId}
                            coverPreviewUrl={coverPreviewUrl} handleCoverChange={handleCoverChange}
                            handleCanvasChange={handleCanvasChange}
                            duration={telegramFileId ? telegramDuration : localDuration}
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
                            featuredArtists={featuredArtists} setFeaturedArtists={setFeaturedArtists}
                        />
                    </div>

                    {/* RIGHT COLUMN: Metadata Form */}
                    <div className="lg:col-span-7 xl:col-span-8 bg-black/5 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-black/10 dark:border-white/10 shadow-sm">
                        <MetadataForm
                            theme={theme}
                            title={title} setTitle={setTitle} language={language} setLanguage={setLanguage}
                            moods={moods} handleMoodToggle={handleMoodToggle} setMoods={setMoods}
                            lyricsRaw={lyricsRaw} handleLyricsChange={handleLyricsChange}
                            featuredArtists={featuredArtists} setFeaturedArtists={setFeaturedArtists}
                        />
                    </div>

                </div>
            </div>

            {/* Mobile Save Button */}
            <div className={`md:hidden p-4 border-t ${theme.border} ${theme.bg} sticky bottom-0 z-50`}>
                {/* <div className="text-xs opacity-50 text-center mb-2">{uploadStep || "Ready to upload"}</div> */}
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

            {/* UPLOAD STATUS MODAL */}
            <UploadStatusModal
                isOpen={showUploadModal}
                steps={uploadSteps}
                isCompleted={isUploadCompleted}
                onClose={() => {
                    setShowUploadModal(false);
                    if (isUploadCompleted) router.push('/remusic/music');
                }}
                theme={theme}
            />
        </div>
    );
}