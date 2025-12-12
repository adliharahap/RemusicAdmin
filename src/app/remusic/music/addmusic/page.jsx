"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  doc, 
  setDoc 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "../../../../../utils/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { db, storage, auth } from "@/utils/firebase"; // Sesuaikan path import firebase config kamu

// Helper untuk menghitung durasi audio di browser
const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    
    audio.onloadedmetadata = () => {
      // Mengembalikan durasi dalam milidetik
      resolve(Math.round(audio.duration * 1000));
      URL.revokeObjectURL(objectUrl);
    };
    
    audio.onerror = (e) => {
      reject("Gagal memuat file audio untuk menghitung durasi.");
    };
  });
};

export default function UploadMusicPage() {
  const router = useRouter();
  
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  
  // Data Fetching State
  const [artists, setArtists] = useState([]);

  // Pilihan Mood (Bisa disesuaikan atau fetch dari DB juga)
  const availableMoods = ["Happy", "Sad", "Energetic", "Relaxing", "Focus", "Chill", "Party", "Romance"];

  // --- 1. Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Redirect jika tidak login
      } else {
        setUser(currentUser);
        fetchArtists();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchArtists = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "artists"));
      const artistList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort berdasarkan nama
      artistList.sort((a, b) => a.name.localeCompare(b.name));
      setArtists(artistList);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching artists:", error);
      alert("Gagal memuat daftar artis.");
      setIsLoading(false);
    }
  };

  // --- 2. Handlers ---
  const handleMoodToggle = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  // --- 3. Core Upload Logic ---
  const handleUpload = async (e) => {
    e.preventDefault();

    // Validasi
    if (!user) return alert("Silakan login kembali.");
    if (!audioFile) return alert("File audio wajib diisi.");
    if (!coverFile) return alert("Cover image wajib diisi.");
    if (!title.trim()) return alert("Judul lagu wajib diisi.");
    if (!selectedArtistId) return alert("Artis wajib dipilih.");

    try {
      setIsUploading(true);
      setUploadStep("Menghitung durasi audio...");
      
      const songId = crypto.randomUUID(); // Generate ID Unik di Client Side
      const durationMs = await getAudioDuration(audioFile);

      // 1. Upload Cover Image ke Firebase Storage
      setUploadStep("Mengunggah cover image...");
      const coverExtension = coverFile.name.split('.').pop();
      const coverRef = ref(storage, `covers/${songId}.${coverExtension}`);
      await uploadBytes(coverRef, coverFile);
      const coverUrl = await getDownloadURL(coverRef);

      // 2. Upload Audio File ke Firebase Storage
      setUploadStep("Mengunggah file audio (ini mungkin memakan waktu)...");
      const audioExtension = audioFile.name.split('.').pop();
      const audioRef = ref(storage, `songs/${songId}.${audioExtension}`);
      await uploadBytes(audioRef, audioFile);
      const audioUrl = await getDownloadURL(audioRef);

      // 3. Simpan Metadata ke Firestore
      setUploadStep("Menyimpan metadata...");
      
      const songData = {
        id: songId, // ID dokumen disamakan dengan ID unik
        title: title,
        artistId: selectedArtistId,
        uploaderUserId: user.uid,
        coverUrl: coverUrl,
        audioUrl: audioUrl,
        durationMs: durationMs,
        moods: selectedMoods,
        lyrics: lyrics,
        playCount: 0,
        likeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Menggunakan setDoc dengan ID tertentu agar konsisten
      await setDoc(doc(db, "songs", songId), songData);

      setUploadStep("Selesai!");
      alert("Lagu berhasil diunggah!");
      
      // Reset Form
      setTitle("");
      setLyrics("");
      setAudioFile(null);
      setCoverFile(null);
      setSelectedMoods([]);
      // Reset input file secara visual (opsional, butuh ref)
      
    } catch (error) {
      console.error("Upload Error:", error);
      alert(`Gagal mengunggah: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Upload New Song</h1>

        <form onSubmit={handleUpload} className="space-y-6">
          
          {/* Title Input */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-400">Judul Lagu</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul lagu..."
              className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Artist Select */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-400">Artis</label>
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="" disabled>Pilih Artis</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">*Pastikan data artis sudah dibuat di menu Artists.</p>
          </div>

          {/* Files Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audio File */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-400">File Audio (MP3/WAV)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                required
              />
              {audioFile && <p className="text-xs text-green-400">Selected: {audioFile.name}</p>}
            </div>

            {/* Cover Image */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-400">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                required
              />
              {coverFile && <p className="text-xs text-green-400">Selected: {coverFile.name}</p>}
            </div>
          </div>

          {/* Moods Selection */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-gray-400">Moods</label>
            <div className="flex flex-wrap gap-2">
              {availableMoods.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => handleMoodToggle(mood)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedMoods.includes(mood)
                      ? "bg-indigo-600 text-white border border-indigo-500"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Lyrics Input */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-400">Lirik Lagu (Opsional)</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Tulis lirik lagu di sini..."
              rows={6}
              className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 resize-y"
            />
          </div>

          {/* Submit Button & Progress */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                isUploading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Upload Song"
              )}
            </button>
            
            {/* Status Text */}
            {isUploading && (
              <p className="text-center text-indigo-400 mt-3 text-sm animate-pulse">
                {uploadStep}
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}