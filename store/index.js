import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
// Kita tidak bisa langsung import storage dari redux-persist karena error di server (SSR)
// Jadi kita pakai createWebStorage
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./authSlice";

// --- FIX UNTUK NEXT.JS SSR ---
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Jika di browser pakai local storage, jika di server pakai noop storage
const storage = typeof window !== "undefined" 
  ? createWebStorage("local") 
  : createNoopStorage();
// -----------------------------

// Gabungkan reducer (persiapan jika nanti ada slice lain seperti cart, dll)
const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"], // Hanya persist slice 'auth'
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Abaikan warning serializable khusus untuk action redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);