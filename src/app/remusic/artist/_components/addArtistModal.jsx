"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop'; // Import Cropper
import { X, Upload, Save, Loader2, Image as ImageIcon, User, Check, ZoomIn } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';
import { uploadArtistPhotoToGithub } from '../_utils/artistHelpers';
import { getCroppedImg } from '../../../../../utils/cropImage';

export default function AddArtistModal({ isOpen, onClose, onSuccess }) {
    // --- STATE UTAMA ---
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [photoBlob, setPhotoBlob] = useState(null); // Hasil crop (Blob)
    const [previewUrl, setPreviewUrl] = useState(null); // URL untuk display preview

    // --- STATE CROPPER ---
    const [imageSrc, setImageSrc] = useState(null); // Gambar mentah dari input
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false); // Mode cropping aktif/tidak

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");

    // --- HANDLERS ---
    
    // 1. Saat user pilih file dari komputer
    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result); // Set source gambar mentah
                setIsCropping(true); // Masuk mode crop
            });
            reader.readAsDataURL(file);
        }
    };

    // 2. Simpan koordinat crop saat user geser-geser
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // 3. Saat user tekan tombol "Selesai Crop"
    const showCroppedImage = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            // Simpan blob untuk diupload nanti
            setPhotoBlob(croppedImageBlob); 
            
            // Buat preview url untuk ditampilkan di UI
            setPreviewUrl(URL.createObjectURL(croppedImageBlob));
            
            setIsCropping(false); // Keluar mode crop
        } catch (e) {
            console.error(e);
            alert("Gagal melakukan crop gambar.");
        }
    };

    // 4. Submit ke Server
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) return alert("Nama artis wajib diisi!");
        if (!photoBlob) return alert("Foto artis wajib diupload!");

        setIsUploading(true);
        setUploadStep("Persiapan...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Anda harus login.");

            const newArtistId = crypto.randomUUID();

            // Konversi Blob ke File object (biar helper GitHub mau terima)
            const fileToUpload = new File([photoBlob], `${newArtistId}.jpg`, { type: "image/jpeg" });

            setUploadStep("Mengunggah Foto ke GitHub...");
            const photoUrl = await uploadArtistPhotoToGithub(fileToUpload, newArtistId);

            setUploadStep("Menyimpan Data...");
            const { error } = await supabase.from('artists').insert({
                id: newArtistId,
                name: name,
                normalized_name: name.toLowerCase(),
                description: description,
                photo_url: photoUrl,
                created_by: user.id
            });

            if (error) throw error;

            setUploadStep("Selesai!");
            alert("Artis berhasil ditambahkan!");
            
            // Reset Semua State
            resetForm();
            
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Error creating artist:", error);
            alert(`Gagal: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadStep("");
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setPhotoBlob(null);
        setPreviewUrl(null);
        setImageSrc(null);
        setIsCropping(false);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="text-indigo-500" /> {isCropping ? "Sesuaikan Foto" : "Tambah Artis Baru"}
                    </h2>
                    <button onClick={() => { onClose(); resetForm(); }} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 relative">
                    
                    {/* --- MODE CROPPER --- */}
                    {isCropping ? (
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-slate-700">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1} // 1:1 Aspect Ratio
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            
                            {/* Slider Zoom */}
                            <div className="flex items-center gap-3 px-2">
                                <ZoomIn size={18} className="text-slate-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setIsCropping(false); setImageSrc(null); }}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-800 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={showCroppedImage}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Selesai Crop
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* --- MODE FORM INPUT --- */
                        <form id="add-artist-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Upload Area */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div className={`w-32 h-32 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-800 relative ${previewUrl ? 'border-indigo-500' : 'border-dashed border-slate-600'}`}>
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-slate-500 w-10 h-10" />
                                        )}
                                        
                                        {/* Overlay Hover */}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Upload className="text-white w-8 h-8" />
                                        </div>
                                        
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 text-center mt-2">
                                        {previewUrl ? "Klik untuk ganti foto" : "Klik untuk upload foto"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nama Artis <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Tulus" 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Bio</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Deskripsi singkat..." 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer (Hanya muncul jika TIDAK sedang cropping) */}
                {!isCropping && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                        <button 
                            onClick={() => { onClose(); resetForm(); }}
                            type="button"
                            disabled={isUploading}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            Tutup
                        </button>
                        <button 
                            type="submit" 
                            form="add-artist-form"
                            disabled={isUploading} 
                            className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <><Loader2 size={16} className="animate-spin" /> {uploadStep}</>
                            ) : (
                                <><Save size={16} /> Simpan Artis</>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}