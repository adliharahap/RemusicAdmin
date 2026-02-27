// --- UPLOAD HELPER (UPDATED TO USE FORMDATA & RETRY LOGIC) ---
export const uploadToGithub = async (file, id, type) => {
    if (!file) return null;

    // Tentukan ekstensi dan path (sesuai logic kamu sebelumnya)
    const ext = file.name.split('.').pop();
    let path = type === 'artist_photo' 
        ? `artists/${id}/${id}.${ext}` 
        : `uploads/${id}/${type}_${id}.${ext}`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    formData.append('message', `Upload ${type} for ID ${id}`);

    const MAX_RETRIES = 4;
    const RETRY_DELAY = 1000; // 1 second

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch('/api/github-upload', {
                method: 'POST',
                // PENTING: JANGAN set 'Content-Type': 'application/json'
                body: formData
            });

            // Handle Error yang lebih rapi
            if (!response.ok) {
                // Cek khusus jika error 413 (File terlalu besar) - TIDAK PERLU RETRY
                if (response.status === 413) {
                    throw new Error("File terlalu besar (Server Limit). Coba kurangi ukuran/resolusi.");
                }

                // Coba baca error sebagai JSON, kalau gagal baca sebagai Text
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || `Upload failed with status ${response.status}`);
                } catch (e) {
                    // Jika response bukan JSON (misal HTML error dari Vercel/Next.js)
                    throw new Error(`Upload Failed (${response.status}): ${errorText.substring(0, 100)}...`);
                }
            }

            const data = await response.json();
            return data.url;

        } catch (error) {
            console.warn(`Attempt ${attempt} failed for ${type}: ${error.message}`);
            lastError = error;

            // Jangan retry jika error fatal (seperti file terlalu besar)
            if (error.message.includes("File terlalu besar")) {
                throw error;
            }

            // Jika belum mencapai batas retry, tunggu sebentar sebelum coba lagi
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    throw lastError || new Error("Upload failed after multiple attempts");
};

// --- UTILS LAINNYA (TETAP SAMA) ---
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