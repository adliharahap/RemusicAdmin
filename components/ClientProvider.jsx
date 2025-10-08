"use client";
import { Provider } from "react-redux";
import { store } from "../store";
import AuthListener from "./AuthListener";

export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthListener>{children}</AuthListener>
    </Provider>
  );
}
