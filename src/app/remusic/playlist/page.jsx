"use client";

import React, { useEffect, useState } from 'react';
import {
  Music,
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  ShieldAlert,
  Globe,
  Lock,
  LayoutGrid,
  List,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../lib/supabaseClient';
import { deletePlaylistCover, uploadPlaylistCover } from './_utils/playlistHelpers';
import { formatDate } from '../../../../utils/formatDateAndNumber';
import { useRouter } from 'next/navigation';


export default function PlaylistDashboard() {
  const router = useRouter();
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('official');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State (Create Playlist)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- FETCH DATA ---
  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      // Query Dasar
      let query = supabase
        .from('playlists')
        .select(`
            *,
            owner:users ( display_name ),
            playlist_songs ( count )
        `)
        .order('created_at', { ascending: false });

      // Filter berdasarkan Tab
      if (activeTab === 'official') {
        query = query.eq('is_official', true);
      } else {
        // Community = Bukan official & Visibility Public
        query = query.eq('is_official', false).eq('visibility', 'public');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Formatting Data
      const formattedData = data.map(p => ({
        ...p,
        owner_name: p.owner?.display_name || "Unknown User",
        song_count: p.playlist_songs?.[0]?.count || 0,
      }));

      setPlaylists(formattedData);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [activeTab]);

  // --- HANDLERS ---

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return alert("Judul wajib diisi!");
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const playlistId = crypto.randomUUID();
      let coverUrl = null;

      // 🔥 UPDATE: Pakai helper baru
      if (coverFile) {
        coverUrl = await uploadPlaylistCover(coverFile, playlistId);
      }

      const { error } = await supabase.from('playlists').insert({
        id: playlistId,
        title: newTitle,
        description: newDesc,
        cover_url: coverUrl,
        owner_user_id: user.id,
        is_official: true,
        visibility: 'public'
      });

      if (error) throw error;

      alert("Playlist berhasil dibuat!");
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setCoverFile(null);
      fetchPlaylists();

    } catch (error) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Update handleDelete
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus playlist ini?")) return;

    try {
      // 🔥 UPDATE: Hapus gambar di GitHub dulu (Fire and forget, biar cepat)
      deletePlaylistCover(id);

      // Baru hapus data di Database
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;

      fetchPlaylists();
    } catch (error) {
      alert("Gagal menghapus: " + error.message);
    }
  };

  // Filter Search Logic
  const filteredData = playlists.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner_name && item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <List className="w-6 h-6 text-indigo-600 dark:text-indigo-500" />
            Playlist Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'official'
              ? "Kurasi playlist editorial untuk halaman utama."
              : "Moderasi playlist publik yang dibuat oleh komunitas."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Cari playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
            />
          </div>

          {activeTab === 'official' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Official Playlist
            </motion.button>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <TabButton
            active={activeTab === 'official'}
            onClick={() => setActiveTab('official')}
            icon={<Music className="w-4 h-4" />}
            label="Official (Remusic)"
          />
          <TabButton
            active={activeTab === 'community'}
            onClick={() => setActiveTab('community')}
            icon={<Users className="w-4 h-4" />}
            label="Community (Public)"
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Playlist" value={playlists.length} icon={List} color="text-blue-500 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />

          <StatCard label="Total Tracks" value={playlists.reduce((acc, curr) => acc + curr.song_count, 0)} icon={Music} color="text-purple-500 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-500/10" />

          <StatCard label={activeTab === 'official' ? "Mode" : "Status"} value={activeTab === 'official' ? "Editorial" : "Moderation"} icon={CheckCircle2} color="text-green-500 dark:text-green-400" bg="bg-green-50 dark:bg-green-500/10" />
        </div>

        {/* Table/List View */}
        <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm min-h-[300px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-5">Playlist Info</div>
            <div className="col-span-3">{activeTab === 'official' ? 'Created At' : 'Owner'}</div>
            <div className="col-span-2 text-center">Total Lagu</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {loading ? (
              <div className="flex justify-center items-center py-20 text-slate-500 dark:text-slate-400 gap-2">
                <Loader2 className="animate-spin w-5 h-5" /> Memuat data...
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredData.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => router.push(`/remusic/playlist/${item.id}`)}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 group transition-colors cursor-pointer"
                  >
                    {/* Column 1: Info & Cover */}
                    <div className="col-span-5 flex items-center gap-4">
                      {/* Fixed Cover Image Logic */}
                      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>
                        {/* Fixed description access */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description || "Tidak ada deskripsi"}</p>
                        {activeTab === 'community' && (
                          <div className="flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              Public
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Owner / Date */}
                    <div className="col-span-3 flex items-center">
                      {activeTab === 'official' ? (
                        // Pakai formatDateHelper
                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate ? formatDate(item.created_at) : item.created_at}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                            {item.owner_name.charAt(0)}
                          </div>
                          {/* Fixed owner name */}
                          <span className="text-sm text-slate-600 dark:text-slate-300">{item.owner_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Stats */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${item.song_count === 0
                          ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}>
                        {/* Fixed song count */}
                        {item.song_count} Lagu
                      </span>
                    </div>

                    {/* Column 4: Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {activeTab === 'official' ? (
                        <>
                          <ActionButton icon={Edit3} tooltip="Edit Info" />
                          <ActionButton
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            icon={Trash2}
                            color="hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                            tooltip="Delete Playlist"
                          />
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:underline px-2"
                          >
                            Takedown
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {!loading && filteredData.length === 0 && (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p>Tidak ada playlist ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL CREATE PLAYLIST --- */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-[#161922] border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Official Playlist</h2>
                  <button onClick={() => setIsModalOpen(false)} disabled={isUploading} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Cover Upload Connected to State */}
                  <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                      {coverFile ? (
                        <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-2 transition-colors" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 text-center px-2">Click to upload cover</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Form Fields Connected to State */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Judul Playlist</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Contoh: Top Hits Indo..."
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Deskripsi Singkat</label>
                      <textarea
                        rows={3}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Deskripsikan suasana playlist ini..."
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg p-3 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Music className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-200/80 leading-relaxed">
                      Setelah playlist dibuat, Anda dapat menambahkan lagu melalui halaman detail playlist.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={isUploading}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploading ? "Menyimpan..." : "Buat Playlist"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB COMPONENTS ---

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${active
          ? "text-slate-900 dark:text-white"
          : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon} {label}
      </span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, tooltip, onClick, color = "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10" }) {
  return (
    <div className="group/btn relative">
      <button
        onClick={onClick}
        className={`p-2 rounded-lg text-slate-400 dark:text-slate-400 transition-all ${color}`}
      >
        <Icon className="w-4 h-4" />
      </button>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-black text-xs text-white rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
}