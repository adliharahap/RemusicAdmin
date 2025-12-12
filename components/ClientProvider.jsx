"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react"; // Import ini
import { store, persistor } from "../store"; // Import persistor juga
import AuthListener from "./AuthListener";

export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      {/* loading={null} bisa diganti dengan komponen <Loading /> 
        jika ingin menampilkan spinner saat membaca local storage 
      */}
      <PersistGate loading={null} persistor={persistor}>
        <AuthListener>
          {children}
        </AuthListener>
      </PersistGate>
    </Provider>
  );
}