"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabaseClient';

// --- SVG Icon for Google (Sama seperti sebelumnya) ---
const GoogleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" className={className}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.636,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // 1. Panggil OAuth Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // PENTING: Redirect balik ke halaman callback kita
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // Note: User tidak langsung login di sini, tapi akan diarahkan ke Google,
      // lalu Google mengembalikan ke /auth/callback untuk set session.

    } catch (error) {
      console.error("Login gagal:", error.message);
      alert("Gagal login dengan Google: " + error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-gray-200 p-4 font-sans">
      {/* Background Gradient Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700 p-8 md:p-12 rounded-2xl shadow-lg text-center">
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Selamat Datang</h1>
                <p className="text-slate-400">Masuk untuk melanjutkan ke Admin Panel</p>
            </div>

            {/* Google Sign-In Button */}
            <button
                type="button"
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full inline-flex justify-center items-center gap-4 bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-700 rounded-lg px-6 py-3 text-md font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="text-sm">Mengalihkan ke Google...</span>
                ) : (
                    <>
                        <GoogleIcon className="w-6 h-6" />
                        <span>Masuk dengan Google</span>
                    </>
                )}
            </button>
            
            <p className="text-center mt-10 text-slate-500 text-xs">
                Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
            </p>
        </div>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} ReMusic. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}