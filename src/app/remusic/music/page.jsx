"use client";

import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons'; 
import { formatNumber } from '../../../../utils/formatDateAndNumber'; 
import EditSongModal from './components/editSongModal';
import { supabase } from '../../../../lib/supabaseClient';
import { Music } from 'lucide-react';
// --- Helper Functions ---

const formatDuration = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: 'numeric', 
    month: 'short', 
    year: 'numeric'
  });
};

export default function MusikPage() {
  // State Data
  const [songs, setSongs] = useState([]);
  const [totalSongs, setTotalSongs] = useState(0); // Total data di DB (untuk hitung halaman)
  
  // State UI
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  
  // State Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const SONGS_PER_PAGE = 50;

  // --- FETCH DATA (SERVER SIDE PAGINATION) ---
  const fetchSongs = async () => {
    setLoading(true);
    try {
      // 1. Hitung Range (Dari baris ke-berapa sampai ke-berapa)
      const from = (currentPage - 1) * SONGS_PER_PAGE;
      const to = from + SONGS_PER_PAGE - 1;

      // 2. Build Query
      let query = supabase
        .from('songs')
        .select(`
          *,
          artists ( name )
        `, { count: 'exact' }) // Minta total jumlah data juga
        .order('created_at', { ascending: false })
        .range(from, to); // Ambil sebagian saja

      // 3. Tambahkan Filter Pencarian (Jika ada)
      if (searchTerm) {
        // Cari berdasarkan judul lagu (Case Insensitive)
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Langsung set data mentah (snake_case)
      setSongs(data || []);
      setTotalSongs(count || 0);

    } catch (error) {
      console.error("Gagal mengambil data lagu:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Efek: Fetch ulang setiap kali halaman atau search berubah
  useEffect(() => {
    // Debounce search agar tidak fetch setiap ketikan (tunggu 500ms)
    const timer = setTimeout(() => {
        fetchSongs();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);


  // --- HANDLERS ---

  const totalPages = Math.ceil(totalSongs / SONGS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset ke halaman 1 jika mencari
  };

  const handleEditClick = (song, e) => {
    e.stopPropagation();
    setSelectedSong(song); // Kirim data asli (snake_case)
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             Manajemen Musik
          </h1>
          <p className="mt-1 text-slate-400">
            Total {formatNumber(totalSongs)} lagu ditemukan.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-grow md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari judul lagu..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <FilterIcon className="w-5 h-5" />
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            onClick={() => {
                setSelectedSong(null);
                setIsModalOpen(true);
            }}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">#</th>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">Lagu</th>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">Artis</th>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">Statistik</th>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">Durasi</th>
                <th className="py-4 px-6 text-left font-semibold text-slate-400">Tanggal</th>
                <th className="py-4 px-6 text-right font-semibold text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                     <td colSpan="7" className="py-4 px-6">
                        <div className="h-12 bg-slate-800 rounded w-full"></div>
                     </td>
                  </tr>
                ))
              ) : songs.length > 0 ? (
                songs.map((song, index) => (
                  <tr
                    key={song.id}
                    onClick={() => { setSelectedSong(song); setIsModalOpen(true); }}
                    className="group hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-slate-500">
                      {/* Hitung nomor urut berdasarkan halaman */}
                      {(currentPage - 1) * SONGS_PER_PAGE + index + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {/* Pakai snake_case: cover_url */}
                        <img
                          src={song.cover_url || "https://placehold.co/100x100/1e293b/ffffff?text=Music"}
                          alt={song.title}
                          className="w-12 h-12 rounded-lg object-cover shadow-sm bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-base mb-0.5">{song.title}</div>
                          <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]">ID: {song.id.split('-')[0]}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {song.artists?.name || "Unknown Artist"}
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col gap-1 text-xs font-medium">
                          {/* Pakai snake_case: play_count, like_count */}
                          <span className="text-indigo-400 flex items-center gap-1">▶ {formatNumber(song.play_count)}</span>
                          <span className="text-rose-400 flex items-center gap-1">♥ {formatNumber(song.like_count)}</span>
                       </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      {/* Pakai snake_case: duration_ms */}
                      {formatDuration(song.duration_ms)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {/* Pakai snake_case: created_at */}
                      {formatDate(song.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all" 
                            title="Edit"
                            onClick={(e) => handleEditClick(song, e)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button 
                            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all" 
                            title="Hapus"
                            onClick={(e) => {
                                e.stopPropagation();
                                alert("Fitur hapus belum ada.");
                            }}
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-24">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                       <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                           <Music className="w-10 h-10 opacity-50" />
                       </div>
                       <h3 className="text-lg font-semibold text-slate-300">Belum ada lagu</h3>
                       <p className="text-sm">Silakan tambahkan lagu baru.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 px-1">
        <p className="text-sm text-slate-400">
           Halaman <span className="text-white font-medium">{currentPage}</span> dari <span className="text-white font-medium">{totalPages || 1}</span>
        </p>
        <div className="flex gap-2">
           <button
             onClick={handlePrevPage}
             disabled={currentPage === 1}
             className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
           >
              <ChevronLeftIcon className="w-5 h-5" />
           </button>
           <button
             onClick={handleNextPage}
             disabled={currentPage >= totalPages}
             className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
           >
              <ChevronRightIcon className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Modal Edit Lagu */}
      <EditSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        song={selectedSong} // Ini sekarang menerima objek snake_case (original data)
        onSuccess={() => fetchSongs()} // Panggil fetch ulang saat sukses edit
      />
    </div>
  );
}