"use client"
import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate } from '../../../../utils/formatDateAndNumber';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../utils/firebase';

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const USER_PER_PAGE = 20;

  useEffect(() => {
    if (fetched) return;
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        console.log(usersData);
      } catch (error) {
        console.error(error);
      } finally {
        setFetched(true);
        setLoading(false);
      }
    };
    fetchUsers();
  }, [fetched]);

  const filteredUsers = users.filter(user =>
    (user.uid ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );


  const totalPages = Math.ceil(filteredUsers.length / USER_PER_PAGE);
  const indexOfLastUser = currentPage * USER_PER_PAGE;
  const indexOfFirstUser = indexOfLastUser - USER_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

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


  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/10 text-red-400 ring-red-500/20';
      case 'uploader':
        return 'bg-sky-500/10 text-sky-400 ring-sky-500/20';
      case 'listener':
        return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 ring-slate-500/20';
    }
  };


  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header: Judul dan Kontrol Aksi */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Manajemen Pengguna</h1>
              <p className="mt-1 text-slate-400">Total {currentUsers.length} pengguna ditemukan.</p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative flex-grow">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
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

          {/* Tabel Data Pengguna */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                    <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pengguna</th>
                    <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                    <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tanggal Bergabung</th>
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
                  ) : currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <tr key={user.uid} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                          {index + 1 + (currentPage - 1) * USER_PER_PAGE}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <img src={user.photoUrl} alt={`Photo of ${user.displayName}`} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <div className="font-medium text-white">{user.displayName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">{user.email}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-300">{formatDate(user.createdAt)}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-indigo-400 hover:text-indigo-300 transition-colors"><EditIcon className="w-5 h-5" /></button>
                            <button className="text-red-500 hover:text-red-400 transition-colors"><DeleteIcon className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-16">
                        <div className="text-gray-400">Tidak ada pengguna ditemukan.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginasi */}
          <div className="flex items-center justify-between pt-3">
            {/* ... existing code ... */}
            <p className="text-sm text-slate-400">Menampilkan <span className="font-medium text-white">{filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}</span> - <span className="font-medium text-white">{indexOfLastUser}</span> dari <span className="font-medium text-white">{filteredUsers.length}</span> hasil</p>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevPage} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={handleNextPage} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

