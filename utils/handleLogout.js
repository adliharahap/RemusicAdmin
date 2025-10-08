import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useDispatch } from "react-redux";
import { clearUser } from "../store/authSlice";

export const logout = async () => {
    const dispatch = useDispatch();

    try {
        await signOut(auth);
        dispatch(clearUser());
        console.log("Logout berhasil ✅");
        // onAuthStateChanged akan otomatis handle redirect / update state
    } catch (error) {
        console.error("Gagal melakukan logout:", error);
        throw error; // bisa dilempar kalau mau ditangani di komponen
    }
};
