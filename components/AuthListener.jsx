"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "../store/authSlice";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../utils/firebase";
import { serializeUser } from "../utils/serializeUser";

export default function AuthListener({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser(serializeUser(currentUser)));
      } else {
        dispatch(clearUser());
        router.push("/login"); // SPA-friendly redirect
      }
    });

    return () => unsubscribe();
  }, [dispatch, router]);

  return children;
}
