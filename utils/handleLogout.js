import { supabase } from "../lib/supabaseClient";

export const logout = async () => {
    try {
        // Di Supabase, signOut mengembalikan object { error }
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        console.log("Logout Supabase berhasil ✅");
        
        // Supabase juga punya onAuthStateChange, tapi jika ingin
        // memaksa redirect/refresh halaman agar bersih total:
        window.location.href = '/login'; 

    } catch (error) {
        console.error("Gagal melakukan logout:", error.message);
        throw error; 
    }
};