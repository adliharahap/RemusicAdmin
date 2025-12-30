"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function TestPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasicSongs = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select(`
            id,
            title,
            language,
            artists (
              name
            )
          `);

        if (error) throw error;

        // Flatten data (meratakan object)
        const cleanData = data.map(song => ({
            id: song.id,
            title: song.title,
            language: song.language,
            artist_name: song.artists?.name || "Unknown Artist"
        }));

        setSongs(cleanData);
      } catch (err) {
        console.error("Gagal ambil lagu:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicSongs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 p-10 font-mono text-sm">
      <h1 className="text-xl font-bold text-white mb-4">Test Fetch Songs (JSON View)</h1>
      
      {loading ? (
        <div className="text-white">Loading data...</div>
      ) : (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl overflow-auto">
            {/* Menampilkan JSON Raw */}
            <pre>{JSON.stringify(songs, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4 text-slate-500">
        Total Items: {songs.length}
      </div>
    </div>
  );
}