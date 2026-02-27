"use client"
import React, { useEffect, useState } from 'react';
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '../../../../public/Icons';
import { formatDate } from '../../../../utils/formatDateAndNumber';
import { supabase } from '../../../../lib/supabaseClient';
import { useSelector } from 'react-redux';
import ChangeRoleModal from './components/changeRoleModal';
import BanUserModal from './components/banUserModal';
import { ShieldAlert } from 'lucide-react';

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedBanUser, setSelectedBanUser] = useState(null);

  // Get current user from Redux
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    if (fetched) return;
    fetchUsers();
  }, [fetched]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);

    } catch (error) {
      console.error("Error fetching users:", error.message);
    } finally {
      setFetched(true);
      setLoading(false);
    }
  };

  // --- LOGIKA FILTERING (Client Side) ---
  const filteredUsers = users.filter(user =>
    (user.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split Users into Staff (Owner/Uploader) and Listeners
  const staffUsers = filteredUsers.filter(u => ['owner', 'uploader'].includes(u.role));
  const listenerUsers = filteredUsers.filter(u => !['owner', 'uploader'].includes(u.role));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20';
      case 'uploader':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20';
      case 'listener':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20';
    }
  };

  const handleEditClick = (targetUser) => {
    // Cek apakah user yang sedang login adalah owner
    // Asumsi: currentUser.role tersedia di Redux state
    // Jika currentUser tidak ada (misal belum load), anggap bukan owner
    const isOwner = currentUser?.role === 'owner';

    if (!isOwner) {
      alert("Anda bukan owner. Hanya owner yang dapat mengubah role pengguna.");
      return;
    }

    setSelectedUser(targetUser);
    setIsModalOpen(true);
  };

  const handleBanClick = (targetUser) => {
    const isOwner = currentUser?.role === 'owner';
    if (!isOwner) {
      alert("Anda bukan owner. Hanya owner yang dapat mengelola status blokir (ban) pengguna.");
      return;
    }
    setSelectedBanUser(targetUser);
    setIsBanModalOpen(true);
  };

  const UserTable = ({ data, title, emptyMessage }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-l-4 border-indigo-500 pl-3">
        {title} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({data.length})</span>
      </h3>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengguna</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal Bergabung</th>
                <th scope="col" className="relative py-3 px-6"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                      <span className="loading loading-spinner loading-md"></span>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <img
                          src={user.photo_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=random`}
                          alt={user.display_name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="truncate">{user.display_name || "Tanpa Nama"}</span>
                            {user.banned_until && new Date(user.banned_until) > new Date() && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                                Banned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${getRoleBadgeColor(user.role)}`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3 transition-opacity">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Ubah Role"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        {currentUser?.role === 'owner' && user.role !== 'owner' && (
                          <button
                            onClick={() => handleBanClick(user)}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${user.banned_until && new Date(user.banned_until) > new Date()
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            title={user.banned_until && new Date(user.banned_until) > new Date() ? "Manage Ban (Currently Banned)" : "Ban User"}
                          >
                            <ShieldAlert className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => alert("Fitur hapus belum tersedia.")}
                          className="p-1.5 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Hapus User"
                        >
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="text-slate-500 dark:text-slate-400">{emptyMessage}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Pengguna</h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Total {filteredUsers.length} pengguna ditemukan.</p>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                />
              </div>
              <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <FilterIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabel Staff (Owner & Uploader) */}
          <UserTable
            data={staffUsers}
            title="Staff (Owner & Uploader)"
            emptyMessage="Tidak ada staff ditemukan."
          />

          {/* Tabel Listener */}
          <UserTable
            data={listenerUsers}
            title="Listener"
            emptyMessage="Tidak ada listener ditemukan."
          />

        </div>
      </div>

      {/* Modal Change Role */}
      <ChangeRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSuccess={() => fetchUsers()}
      />

      {/* Modal Ban User (Owner Only) */}
      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        user={selectedBanUser}
        onSuccess={() => {
          fetchUsers();
          // Optional: You could fetch/send an FCM push ref here indicating they got banned
        }}
      />
    </div>
  );
}