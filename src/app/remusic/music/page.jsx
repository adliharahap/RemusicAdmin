"use client"
import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate, formatNumber } from '../../../../utils/formatDateAndNumber';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../utils/firebase';
import EditSongModal from './components/editSongModal';

// --- Helper Functions ---
const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function MusikPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const SONGS_PER_PAGE = 20;

  useEffect(() => {
    if (fetched) return;
    const fetchSongs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "songs"));
        const songsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSongs(songsData);
        console.log(songsData);
      } catch (error) {
        console.error(error);
      } finally {
        setFetched(true);
        setLoading(false);
      }
    };
    fetchSongs();
  }, [fetched]);

  const filteredSongs = songs.filter(song =>
    (song.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artistId ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );


  const totalPages = Math.ceil(filteredSongs.length / SONGS_PER_PAGE);
  const indexOfLastSong = currentPage * SONGS_PER_PAGE;
  const indexOfFirstSong = indexOfLastSong - SONGS_PER_PAGE;
  const currentSongs = filteredSongs.slice(indexOfFirstSong, indexOfLastSong);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header: Judul dan Kontrol Aksi */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Musik</h1>
          <p className="mt-1 text-slate-400">Total {songs.length} lagu ditemukan.</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari lagu..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <button className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <FilterIcon className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">
            <PlusIcon className="w-5 h-5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Tabel Data Musik */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Lagu</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artis</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Diputar</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Suka</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Durasi</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Moods</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ditambahkan</th>
                <th scope="col" className="relative py-3 px-6"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="text-gray-400">Memuat data lagu...</div>
                  </td>
                </tr>
              ) : currentSongs.length > 0 ? (
                currentSongs.map((song, index) => (
                  <tr
                    key={song.id}
                    onClick={() => { setSelectedSong(song); setIsModalOpen(true); }}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {index + 1 + (currentPage - 1) * SONGS_PER_PAGE}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {song.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <img
                          src={song.coverUrl}
                          alt={`Cover for ${song.title}`}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                        <div>
                          <div className="font-medium text-white">{song.title}</div>
                          <div className="text-sm text-slate-400">{song.artistName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-300">
                      {song.artistid}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {formatNumber(song.playCount)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {formatNumber(song.likeCount)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {formatDuration(song.durationMs)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5">
                        {song.moods?.slice(0, 2).map((mood) => (
                          <span
                            key={mood}
                            className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full"
                          >
                            {mood}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {formatDate(song.createdAt)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button className="text-red-500 hover:text-red-400 transition-colors">
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="text-gray-400">Tidak ada lagu yang ditemukan.</div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Paginasi */}
      <div className="flex items-center justify-between pt-3">
        <p className="text-sm text-slate-400">Menampilkan <span className="font-medium text-white">{filteredSongs.length > 0 ? indexOfFirstSong + 1 : 0}</span> - <span className="font-medium text-white">{Math.min(indexOfLastSong, filteredSongs.length)}</span> dari <span className="font-medium text-white">{formatNumber(filteredSongs.length)}</span> hasil</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            fetched={setFetched}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Edit Lagu */}
      <EditSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        song={selectedSong}
        fetched={()=> setFetched(false)}
      />
    </div>
  );
}

