"use client"
import React from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate, formatNumber } from '../../../../utils/formatDateAndNumber';

// --- Mock Data ---
const mockArtists = [
  {
    id: "11e8109c-6c27-4b3f-88ab-e482a3f0605e",
    name: "Billie Eilish",
    normalizedName: "billie eilish",
    photoUrl: "https://bnqhatesnqukmsbjaulm.supabase.co/storage/v1/object/public/Remusic%20Storage/artist/11e8109c-6c27-4b3f-88ab-e482a3f0605e/billie-eilish.jpg",
    description: "Billie Eilish Pirate Baird O'Connell (lahir 18 Desember 2001) adalah seorang penyanyi...",
    songCount: 58,
    followers: 110543987,
    createdAt: new Date('2023-09-13T14:30:47Z'),
    updatedAt: new Date('2023-09-13T14:30:47Z'),
    createdBy: "hU2iYcLiwBZzOulqINl3r0efhYJ2",
  },
  {
    id: "a2b4c6d8-e0f2-4a9b-8d7c-1f3a5b7e9d0c",
    name: "Tulus",
    normalizedName: "tulus",
    photoUrl: "https://placehold.co/100x100/10B981/FFFFFF?text=T",
    description: "Muhammad Tulus (lahir 20 Agustus 1987) adalah seorang penyanyi dan penulis lagu Indonesia.",
    songCount: 45,
    followers: 8976123,
    createdAt: new Date('2023-08-20T10:00:00Z'),
    updatedAt: new Date('2023-08-20T10:00:00Z'),
    createdBy: "user_abc123",
  },
  {
    id: "f4g6h8i0-j2k4-4l6m-8n0o-p2q4r6s8t0u2",
    name: "Afgan",
    normalizedName: "afgan",
    photoUrl: "https://placehold.co/100x100/3B82F6/FFFFFF?text=A",
    description: "Afgansyah Reza (lahir 27 Mei 1989) adalah seorang penyanyi, penulis lagu, dan aktor Indonesia.",
    songCount: 62,
    followers: 12450876,
    createdAt: new Date('2023-07-15T18:45:00Z'),
    updatedAt: new Date('2023-07-15T18:45:00Z'),
    createdBy: "user_def456",
  },
  {
    id: "u8v0w2x4-y6z8-4a0b-2c4d-e6f8g0h2i4j6",
    name: "Fiersa Besari",
    normalizedName: "fiersa besari",
    photoUrl: "https://placehold.co/100x100/F59E0B/FFFFFF?text=F",
    description: "Fiersa Besari (lahir 3 Maret 1984) adalah seorang penulis, musisi, dan kreator konten asal Indonesia.",
    songCount: 38,
    followers: 5123456,
    createdAt: new Date('2023-06-01T09:20:00Z'),
    updatedAt: new Date('2023-06-01T09:20:00Z'),
    createdBy: "user_ghi789",
  },
];


export default function ArtistPage() {
  return (
    <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
            {/* Header: Judul dan Kontrol Aksi */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                <h1 className="text-2xl font-bold text-white">Manajemen Artis</h1>
                <p className="mt-1 text-slate-400">Total {mockArtists.length} artis ditemukan.</p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input type="text" placeholder="Cari artis..." className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
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

            {/* Tabel Data Artis */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="border-b border-slate-800">
                    <tr>
                        <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Artis</th>
                        <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total Lagu</th>
                        <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pengikut</th>
                        <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ditambahkan</th>
                        <th scope="col" className="relative py-3 px-6"><span className="sr-only">Aksi</span></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {mockArtists.map((artist) => (
                        <tr key={artist.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                            <img src={artist.photoUrl} alt={`Photo of ${artist.name}`} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <div className="font-medium text-white">{artist.name}</div>
                            </div>
                            </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">{formatNumber(artist.songCount)}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">{formatNumber(artist.followers)}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">{formatDate(artist.createdAt)}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-indigo-400 hover:text-indigo-300 transition-colors"><EditIcon className="w-5 h-5"/></button>
                            <button className="text-red-500 hover:text-red-400 transition-colors"><DeleteIcon className="w-5 h-5"/></button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            
            {/* Paginasi */}
            <div className="flex items-center justify-between pt-3">
                <p className="text-sm text-slate-400">Menampilkan <span className="font-medium text-white">1</span> - <span className="font-medium text-white">{mockArtists.length}</span> dari <span className="font-medium text-white">{mockArtists.length}</span> hasil</p>
                <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
                </div>
            </div>
            </div>
        </div>
    </div>
  );
}
