// src/utils/playlistHelpers.js

/**
 * Upload Cover Playlist ke GitHub
 * Path: playlists/{playlistId}/cover.{ext}
 */
export const uploadPlaylistCover = async (file, playlistId) => {
    if (!file) return null;

    // 1. Convert ke Base64
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // 2. Tentukan Path yang Konsisten
    // Kita namakan filenya 'cover' biar gampang ditimpa/dihapus nanti
    const ext = file.name.split('.').pop();
    const path = `playlists/${playlistId}/cover.${ext}`;

    // 3. Panggil API Upload (yang sudah Mas punya)
    const response = await fetch('/api/github-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: base64,
            path: path,
            message: `Update cover for playlist ${playlistId}`
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal upload cover playlist');

    return data.url; // Mengembalikan URL Publik (Rawgit/Jsdelivr)
};

/**
 * Hapus Folder/Cover Playlist dari GitHub
 * Ini memanggil API Route baru yang akan kita buat di langkah 2
 */
export const deletePlaylistCover = async (playlistId) => {
    if (!playlistId) return;

    // Kita asumsikan folder playlist ada di path: playlists/{playlistId}
    const folderPath = `playlists/${playlistId}`;

    try {
        const response = await fetch('/api/github-delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: folderPath })
        });

        const data = await response.json();
        if (!response.ok) {
            console.warn("Gagal hapus gambar di GitHub:", data.error);
            // Warning saja, jangan throw error biar proses delete playlist di database tetap jalan
        } else {
            console.log("Gambar playlist berhasil dihapus dari GitHub");
        }
    } catch (error) {
        console.error("Error deleting github image:", error);
    }
};