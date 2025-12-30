"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Music, Clock, Save, MoreHorizontal, 
  Search, Plus, GripVertical, Trash2, X, Disc, Loader2, Check
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { supabase } from '../../../../../lib/supabaseClient';
import { formatDate } from '../../../../../utils/formatDateAndNumber';

// --- HELPER: Format Durasi (ms -> mm:ss) ---
const formatDuration = (ms) => {
  if (!ms) return "00:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// --- HELPER: Hitung Total Durasi Playlist ---
const calculateTotalDuration = (songs) => {
  const totalMs = songs.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
};

// --- SUB COMPONENT FOR DRAGGABLE ITEM ---
function SongItem({ song, index, removeSong }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={song}
      id={song.playlist_song_id} // Gunakan ID unik dari tabel playlist_songs
      as="div"
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      whileDrag={{ backgroundColor: "rgba(30, 41, 59, 0.8)", scale: 1.02, zIndex: 50 }}
      className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/[0.02] group transition-colors relative bg-[#0F1117] border-b border-white/5 last:border-0"
    >
      <div className="col-span-1 flex justify-center text-slate-500">
        <span className="group-hover:hidden text-sm font-medium text-slate-600 select-none">{index + 1}</span>
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="hidden group-hover:block cursor-grab active:cursor-grabbing text-slate-400 hover:text-white touch-none p-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      
      <div className="col-span-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0 select-none overflow-hidden">
           {song.cover ? (
              <img src={song.cover} alt={song.title} className="w-full h-full object-cover"/>
           ) : (
              <Music className="w-5 h-5 text-slate-600" />
           )}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors select-none">{song.title}</h4>
          <div className="flex items-center gap-1 text-xs text-slate-500 truncate select-none">
            <span className="text-slate-400">{song.artist}</span>
          </div>
        </div>
      </div>

      <div className="col-span-3 text-xs text-slate-500 select-none">
        {song.addedAt}
      </div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        <span className="text-xs text-slate-500 font-mono select-none">{song.duration}</span>
        <button 
          onClick={() => removeSong(song.playlist_song_id)}
          className="text-slate-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Hapus lagu"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function PlaylistDetail() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id;

  // --- STATE ---
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]); // Lagu yang ada di playlist
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState(null); // ID lagu yang sedang loading ditambahkan
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // --- 1. FETCH PLAYLIST DETAIL & SONGS ---
  const fetchPlaylistData = useCallback(async () => {
    try {
      setLoading(true);

      // A. Ambil Metadata Playlist
      const { data: playlistData, error: plError } = await supabase
        .from('playlists')
        .select(`*, owner:users(display_name)`)
        .eq('id', playlistId)
        .single();

      if (plError || !playlistData) {
         console.error("Playlist not found");
         router.push('/remusic/playlists');
         return;
      }
      setPlaylist(playlistData);

      // B. Ambil Lagu di Playlist (Join ke songs & artists)
      // Kita join ke tabel 'playlist_songs' lalu ambil detail lagu dari 'songs'
      const { data: songData, error: songError } = await supabase
        .from('playlist_songs')
        .select(`
          id,
          added_at,
          position,
          song:songs (
            id, title, duration_ms, cover_url,
            artist:artists ( name )
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true }) // Urutkan berdasarkan posisi custom user
        .order('added_at', { ascending: false }); // Fallback

      if (songError) throw songError;

      // Flatten structure biar enak dipakai di UI dan Reorder Component
      const formattedSongs = songData.map(item => ({
        playlist_song_id: item.id, // ID Unik Row (Penting untuk delete/reorder)
        id: item.song?.id,          // ID Lagu asli
        title: item.song?.title || "Unknown Title",
        artist: item.song?.artist?.name || "Unknown Artist",
        cover: item.song?.cover_url,
        duration: formatDuration(item.song?.duration_ms),
        duration_ms: item.song?.duration_ms, // Untuk hitung total
        addedAt: formatDate(item.added_at),
        position: item.position
      }));

      setSongs(formattedSongs);

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Terjadi kesalahan memuat data.");
    } finally {
      setLoading(false);
    }
  }, [playlistId, router]);

  useEffect(() => {
    if (playlistId) fetchPlaylistData();
  }, [playlistId, fetchPlaylistData]);


  // --- 2. SEARCH SONGS (Realtime Database) ---
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setIsSearching(true);
      
      // Cari lagu di tabel 'songs' yang judulnya mirip
      const { data, error } = await supabase
        .from('songs')
        .select(`
            id, title, duration_ms, cover_url,
            artist:artists ( name )
        `)
        .ilike('title', `%${query}%`)
        .limit(10); // Batasi hasil

      if (!error) {
        // Cek apakah lagu sudah ada di playlist (untuk visual feedback)
        const mappedResults = data.map(s => ({
            ...s,
            artist_name: s.artist?.name,
            is_added: songs.some(existing => existing.id === s.id)
        }));
        setSearchResults(mappedResults);
      }
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };


  // --- 3. ADD SONG TO PLAYLIST ---
const addSong = async (song) => {
    // 1. Cek duplikat
    if (songs.some(s => s.id === song.id)) {
        alert("Lagu ini sudah ada di playlist!");
        return;
    }

    setAddingId(song.id);
    try {
      // 2. Dapatkan posisi terakhir
      const nextPosition = songs.length > 0 ? Math.max(...songs.map(s => s.position || 0)) + 1 : 1;
      
      // Ambil user ID
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Insert ke Database (playlist_songs)
      const { data, error } = await supabase
        .from('playlist_songs')
        .insert({
            playlist_id: playlistId,
            song_id: song.id,
            position: nextPosition,
            added_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Update State Lokal (Optimistic UI)
      // 🔥 FIX: Pastikan duration_ms diambil dari parameter 'song' (hasil search)
      const durationVal = song.duration_ms || 0; 

      const newSongFormatted = {
        playlist_song_id: data.id,  // ID dari tabel playlist_songs
        id: song.id,                // ID dari tabel songs
        title: song.title,
        artist: song.artist_name || "Unknown",
        cover: song.cover_url,
        duration: formatDuration(durationVal), // Format ke mm:ss
        duration_ms: durationVal,              // Simpan angka asli untuk kalkulasi total
        addedAt: "Baru saja",
        position: nextPosition
      };

      setSongs(prev => [...prev, newSongFormatted]); 
      
      // Update status tombol di hasil pencarian
      setSearchResults(prev => prev.map(s => s.id === song.id ? {...s, is_added: true} : s));

    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan lagu: " + err.message);
    } finally {
      setAddingId(null);
    }
  };

  // --- 5. SAVE REORDER (FIXED) ---
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
        // 🔥 FIX: Upsert butuh semua kolom NOT NULL (playlist_id & song_id) 
        // meskipun kita cuma mau update posisi.
        const updates = songs.map((song, index) => ({
            id: song.playlist_song_id, // Kunci utama (Primary Key)
            playlist_id: playlistId,   // WAJIB ADA (Constraint NOT NULL)
            song_id: song.id,          // WAJIB ADA (Constraint NOT NULL)
            position: index + 1,       // Data yang mau diubah
        }));

        const { error } = await supabase
            .from('playlist_songs')
            .upsert(updates, { onConflict: 'id' }); // Update jika ID sudah ada

        if (error) throw error;
        alert("Urutan lagu berhasil disimpan!");

    } catch (error) {
        console.error("Save order error:", error);
        alert(`Gagal menyimpan urutan: ${error.message}`);
    } finally {
        setIsSavingOrder(false);
    }
  };

  // --- 4. REMOVE SONG ---
  const removeSong = async (playlistSongId) => {
    if(!confirm("Hapus lagu ini dari playlist?")) return;

    // Optimistic Update (Hapus duluan dari UI biar cepet)
    const backupSongs = [...songs];
    setSongs(songs.filter(s => s.playlist_song_id !== playlistSongId));

    try {
        const { error } = await supabase
            .from('playlist_songs')
            .delete()
            .eq('id', playlistSongId);
        
        if (error) throw error;
        
        // Refresh status di pencarian jika lagu dihapus
        const removedSong = backupSongs.find(s => s.playlist_song_id === playlistSongId);
        if(removedSong) {
             setSearchResults(prev => prev.map(s => s.id === removedSong.id ? {...s, is_added: false} : s));
        }

    } catch (err) {
        alert("Gagal menghapus.");
        setSongs(backupSongs); // Balikin kalau gagal
    }
  };

  if (loading || !playlist) {
      return (
        <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Memuat playlist...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* --- HEADER NAVIGATION --- */}
      <nav className="sticky top-0 z-40 bg-[#0F1117]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-400">Kembali ke Playlist</span>
        </div>
        
        <button 
            onClick={handleSaveOrder}
            disabled={isSavingOrder}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {isSavingOrder ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
          {isSavingOrder ? "Menyimpan..." : "Simpan Urutan"}
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-white/5">
        {/* Background Blur Mesh */}
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-900/20 opacity-30 blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover Art */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-48 h-48 md:w-60 md:h-60 rounded-xl shadow-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden"
            >
              {playlist.cover_url ? (
                <img src={playlist.cover_url} alt={playlist.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-20 h-20 text-white/10" />
              )}
            </motion.div>

            {/* Meta Info */}
            <div className="flex-1 space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                <span>{playlist.is_official ? "Official Playlist" : "Community Playlist"}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Created {formatDate(playlist.created_at)}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                {playlist.title}
              </h1>
              
              <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                {playlist.description || "Tidak ada deskripsi."}
              </p>

              <div className="flex items-center gap-6 text-sm text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-slate-500" />
                  <span>{songs.length} Lagu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{calculateTotalDuration(songs)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {playlist.owner?.display_name?.charAt(0) || "A"}
                  </div>
                  <span>{playlist.owner?.display_name || "Admin"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA (ADD SONG & LIST) --- */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: SONG LIST (Main Content) */}
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-indigo-500" />
              Daftar Lagu
            </h2>
            <div className="text-xs text-slate-500">Drag icon <GripVertical className="w-3 h-3 inline" /> untuk menyusun ulang</div>
          </div>

          <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[200px]">
            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6">Judul Lagu</div>
              <div className="col-span-3">Added</div>
              <div className="col-span-2 text-right">
                <Clock className="w-4 h-4 ml-auto" />
              </div>
            </div>

            {/* List Body (Reorder Group) */}
            <Reorder.Group 
              axis="y" 
              values={songs} 
              onReorder={setSongs}
              className="w-full"
            >
              <AnimatePresence initial={false}>
                {songs.map((song, index) => (
                  <SongItem 
                    key={song.playlist_song_id} 
                    song={song} 
                    index={index} 
                    removeSong={removeSong} 
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
            
            {songs.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music className="w-6 h-6 text-slate-600"/>
                </div>
                <p>Playlist kosong. Tambahkan lagu dari panel kanan.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ADD SONGS PANEL (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-[#161922] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Tambah Lagu</h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium">Database Remusic</span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Cari Judul, Artis..." 
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setIsSearching(false); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results Area */}
              <div className="min-h-[300px] max-h-[500px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                {isSearching ? (
                   <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-xs">Mencari...</p>
                   </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <motion.div 
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group border border-transparent hover:border-white/5 transition-all"
                      >
                        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors overflow-hidden">
                           {result.cover_url ? (
                                <img src={result.cover_url} className="w-full h-full object-cover"/>
                           ) : <Music className="w-5 h-5 text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{result.title}</h4>
                          <p className="text-xs text-slate-500 truncate">{result.artist_name}</p>
                        </div>
                        
                        {result.is_added ? (
                            <button disabled className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 cursor-default">
                                <Check className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => addSong(result)}
                                disabled={addingId === result.id}
                                className="p-2 rounded-full bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shrink-0 disabled:opacity-50"
                            >
                                {addingId === result.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                            </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // Empty State / Suggestions
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Mulai Pencarian</p>
                      <p className="text-xs text-slate-600 mt-1 max-w-[200px] mx-auto">
                        Ketik judul lagu atau nama artis untuk menambahkan ke playlist.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/10 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                  <Save className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-200 mb-1">Simpan Urutan</h4>
                  <p className="text-xs text-indigo-200/60 leading-relaxed">
                    Setelah melakukan Drag & Drop, jangan lupa klik tombol "Simpan Urutan" di pojok kanan atas agar posisi lagu tersimpan di database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}