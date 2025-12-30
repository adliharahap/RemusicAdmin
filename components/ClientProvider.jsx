"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import AuthListener from "./AuthListener";
import { ThemeProvider } from "next-themes";

export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthListener>
            {children}
          </AuthListener>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}