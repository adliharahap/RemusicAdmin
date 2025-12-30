"use client"
import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate, formatNumber } from '../../../../utils/formatDateAndNumber';
import { supabase } from '../../../../lib/supabaseClient';
import AddArtistModal from './_components/addArtistModal';

export default function ArtistPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetched, setFetched] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

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
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                                                        <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"><EditIcon className="w-5 h-5" /></button>
                                                            <button className="text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400"><DeleteIcon className="w-5 h-5" /></button>
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
        </>
    );
}