"use client"
import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate, formatNumber } from '../../../../utils/formatDateAndNumber';
import { supabase } from '../../../../lib/supabaseClient';
import AddArtistModal from './_components/addArtistModal';
import EditArtistModal from './_components/EditArtistModal';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

// --- Helper Functions ---
const urlToGithubPath = (url) => {
    if (!url) return null;
    try {
        const match = url.match(/\/gh\/[^/]+\/[^/]+@[^/]+\/(.+)/);
        if (match) return match[1];
        const match2 = url.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)/);
        if (match2) return match2[1];
    } catch (_) { }
    return null;
};

const deleteFromGithub = async (url) => {
    const path = urlToGithubPath(url);
    if (!path) return;
    const res = await fetch('/api/github-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    });
    // 404 = file sudah tidak ada, anggap sukses
    if (!res.ok && res.status !== 404) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gagal hapus file dari GitHub (${res.status}): ${err.error || 'Unknown error'}`);
    }
};

export default function ArtistPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetched, setFetched] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // URL Pagination Hooks
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Get current page from URL or default to 1
    const currentPage = Number(searchParams.get('page')) || 1;

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState(null);

    // Delete State
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (fetched) return;

        const fetchArtists = async () => {
            try {
                setLoading(true);

                // QUERY PINTAR: Ambil data artis + Hitung Lagu + Hitung Follower
                const { data, error } = await supabase
                    .from('artists')
                    .select(`
                *,
                songs ( count ),
                artist_followers ( count )
            `)
                    .order('name', { ascending: true });

                if (error) throw error;

                // Flatten data structure
                const formattedData = data.map(artist => ({
                    ...artist,
                    // Trik mengambil count dari Supabase Relation
                    total_songs: artist.songs?.[0]?.count || 0,
                    total_followers: artist.artist_followers?.[0]?.count || 0
                }));

                setArtists(formattedData || []);
            } catch (error) {
                console.error("Error fetching artists:", error.message);
            } finally {
                setFetched(true);
                setLoading(false);
            }
        };

        fetchArtists();
    }, [fetched]);

    // Filter Logic
    const filteredArtists = artists.filter(artist =>
        (artist.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentArtists = filteredArtists.slice(indexOfFirstItem, indexOfLastItem);

    // Helper to update URL
    const updatePage = (pageNumber) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleNextPage = () => { if (currentPage < totalPages) updatePage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) updatePage(currentPage - 1); };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        updatePage(1); // Reset to page 1 on search
    };

    const handleEditClick = (artist) => {
        setSelectedArtist(artist);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (artist, e) => {
        e.stopPropagation();
        setDeleteError(null);
        setDeleteTarget(artist);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            // 1. Delete photo from GitHub if it exists
            if (deleteTarget.photo_url) {
                await deleteFromGithub(deleteTarget.photo_url);
            }

            // 2. Delete artist record from Supabase
            const { error } = await supabase.from('artists').delete().eq('id', deleteTarget.id);
            if (error) throw error;

            // 3. Refresh list & close modal
            setDeleteTarget(null);
            setFetched(false); // triggers re-fetch
        } catch (err) {
            console.error('Delete artist failed:', err);
            setDeleteError(err.message || 'Gagal menghapus artis. Coba lagi.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="p-6 space-y-6">
                <div>
                    <div className="space-y-6">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Artis</h1>
                                <p className="mt-1 text-slate-500 dark:text-slate-400">Total {filteredArtists.length} artis ditemukan.</p>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative flex-grow">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari artis..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition"
                                    />
                                </div>
                                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">
                                    <PlusIcon className="w-5 h-5" />
                                    <span>Tambah</span>
                                </button>
                            </div>
                        </div>

                        {/* Tabel Data Artis */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Artis</th>
                                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Lagu</th>
                                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengikut</th>
                                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ditambahkan</th>
                                            <th className="relative py-3 px-6"><span className="sr-only">Aksi</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-10 text-slate-500 dark:text-slate-400">Memuat data...</td></tr>
                                        ) : currentArtists.length > 0 ? (
                                            currentArtists.map((artist) => (
                                                <tr key={artist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={artist.photo_url || `https://ui-avatars.com/api/?name=${artist.name}&background=random`}
                                                                alt={artist.name}
                                                                className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-800"
                                                            />
                                                            <div className="font-medium text-slate-900 dark:text-white">{artist.name}</div>
                                                        </div>
                                                    </td>
                                                    {/* 🔥 TOTAL LAGU (Real Data) */}
                                                    <td className="py-4 px-6 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">
                                                        {formatNumber(artist.total_songs)}
                                                    </td>

                                                    {/* 🔥 TOTAL FOLLOWERS (Real Data jika tabel dibuat) */}
                                                    <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                        {formatNumber(artist.total_followers)}
                                                    </td>

                                                    <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                        {artist.created_at ? formatDate(artist.created_at) : "-"}
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-4 transition-opacity">
                                                            <button onClick={() => handleEditClick(artist)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"><EditIcon className="w-5 h-5" /></button>
                                                            <button onClick={(e) => handleDeleteClick(artist, e)} className="text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400"><DeleteIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center py-10 text-slate-500 dark:text-slate-400">Tidak ada artis ditemukan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Paginasi */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Halaman <span className="text-slate-900 dark:text-white font-medium">{currentPage}</span> dari <span className="text-slate-900 dark:text-white font-medium">{totalPages || 1}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal Add Artist */}
            <AddArtistModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => setFetched(true)}
            />

            {/* Modal Edit Artist */}
            <EditArtistModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                artist={selectedArtist}
                onSuccess={() => setFetched(false)}
            />

            {/* Modal Konfirmasi Hapus Artis */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !isDeleting && setDeleteTarget(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-500/10 mx-auto mb-4">
                            <DeleteIcon className="w-7 h-7 text-rose-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">Hapus Artis?</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
                            Artis <span className="font-semibold text-slate-700 dark:text-slate-200">&ldquo;{deleteTarget.name}&rdquo;</span> akan dihapus permanen.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6">
                            Foto artis di GitHub juga akan ikut terhapus.
                        </p>

                        {deleteError && (
                            <div className="mb-4 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Menghapus...
                                    </>
                                ) : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}