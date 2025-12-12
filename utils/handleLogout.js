import { signOut } from "firebase/auth";
import { auth } from "./firebase";

export const logout = async () => {
    try {
        await signOut(auth);
        console.log("Logout berhasil ✅");
        // onAuthStateChanged akan otomatis handle redirect / update state
    } catch (error) {
        console.error("Gagal melakukan logout:", error);
        throw error; // bisa dilempar kalau mau ditangani di komponen
    }
};
