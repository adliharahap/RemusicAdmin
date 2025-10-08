
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ClientProvider from "../../components/ClientProvider";

const poppins = Poppins({
  subsets: ["latin"], 
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Remusic Admin Control",
  description: "Admin control panel for Remusic music streaming service",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
