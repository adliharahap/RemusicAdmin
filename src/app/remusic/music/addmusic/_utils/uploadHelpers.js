// --- UPLOAD HELPER (UPDATED TO USE FORMDATA) ---
export const uploadToGithub = async (file, id, type) => {
    if (!file) return null;

    // Tentukan ekstensi dan path (sesuai logic kamu sebelumnya)
    const ext = file.name.split('.').pop();
    let path = type === 'artist_photo' 
        ? `artists/${id}/${id}.${ext}` 
        : `uploads/${id}/${type}_${id}.${ext}`;
    
    // PERUBAHAN UTAMA DI SINI:
    // Kita pakai FormData untuk mengirim file binary langsung (lebih hemat memori & lolos limit JSON)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    formData.append('message', `Upload ${type} for ID ${id}`);

    const response = await fetch('/api/github-upload', {
        method: 'POST',
        // PENTING: JANGAN set 'Content-Type': 'application/json'
        // Browser akan otomatis set boundary multipart/form-data
        body: formData
    });

    // Handle Error yang lebih rapi
    if (!response.ok) {
        // Cek khusus jika error 413 (File terlalu besar)
        if (response.status === 413) {
            throw new Error("File terlalu besar (Server Limit). Coba kurangi ukuran/resolusi.");
        }

        // Coba baca error sebagai JSON, kalau gagal baca sebagai Text
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Upload failed');
        } catch (e) {
            // Jika response bukan JSON (misal HTML error dari Vercel/Next.js)
            throw new Error(`Upload Failed (${response.status}): ${errorText.substring(0, 100)}...`);
        }
    }

    const data = await response.json();
    return data.url;
};

// --- UTILS LAINNYA (TETAP SAMA) ---

export const parseLrc = (lrcString) => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    return lines.map((line, index) => {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + milliseconds / 1000;
            return { time, text: match[4].trim(), original: line, index };
        }
        return { time: -1, text: line, original: line, index };
    }).filter(l => l.time !== -1);
};

export const formatTimestamp = (currentTime) => {
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const ms = Math.floor((currentTime % 1) * 100);
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
};

export const getAudioDuration = (file) => {
    return new Promise((resolve) => {
        if (!file) { resolve(0); return; }
        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.onloadedmetadata = () => {
            resolve(Math.round(audio.duration * 1000));
            URL.revokeObjectURL(objectUrl);
        };
        audio.onerror = () => resolve(0);
    });
};