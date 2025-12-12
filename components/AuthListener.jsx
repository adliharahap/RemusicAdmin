"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "../store/authSlice"; 
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient"; 

export default function AuthListener({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  // Ref untuk mencegah race condition (double fetch di React Strict Mode)
  const isCheckInProgress = useRef(false);

  useEffect(() => {
    const validateAndSyncUser = async () => {
      // Mencegah fungsi jalan 2x bersamaan
      if (isCheckInProgress.current) return;
      isCheckInProgress.current = true;

      try {
        // 1. VALIDASI TOKEN KE SERVER (Lebih aman dari getSession)
        // Ini memastikan data di Redux Persist masih valid di mata server
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          console.warn("Token invalid/expired. Mencoba refresh session...");
          
          // --- LOGIKA ANTI LOGOUT TIBA-TIBA ---
          // Jika getUser gagal (misal koneksi putus sesaat), coba refresh manual
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.log("Refresh gagal. Logout user.");
            // Token benar-benar mati, baru kita hapus data Redux
            dispatch(clearUser());
            if (pathname !== '/login') {
               router.push('/login');
               router.refresh();
            }
            return;
          }
          
          // Jika refresh berhasil, gunakan user dari sesi baru
          // Lanjut ke logika fetch profile di bawah...
        }

        // User valid (baik dari getUser atau hasil refresh)
        const currentUser = user || (await supabase.auth.getUser()).data.user;

        // 2. AMBIL DATA PROFILE DARI DB (public.users)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error("Gagal ambil profile DB:", profileError.message);
        }

        // 3. GABUNGKAN DATA (Merge)
        // Data dari DB menimpa metadata Auth
        const fullUser = {
          ...currentUser,
          ...currentUser.user_metadata, // Fallback metadata
          ...profile, // Data 'real' dari tabel users (role, photo_url, dll)
        };

        // 4. UPDATE REDUX (Persist akan menyimpannya)
        dispatch(setUser(fullUser));

      } catch (err) {
        console.error("Auth Listener Error:", err);
      } finally {
        isCheckInProgress.current = false;
      }
    };

    // Jalankan validasi saat komponen di-mount (Refresh Halaman)
    validateAndSyncUser();

    // 5. LISTENER REALTIME
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           // Panggil fungsi validasi utama agar logic terpusat
           validateAndSyncUser();
        } else if (event === 'SIGNED_OUT') {
           dispatch(clearUser());
           if (pathname !== '/login') {
              router.push('/login');
              router.refresh();
           }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, router, pathname, supabase]);

  return children;
}