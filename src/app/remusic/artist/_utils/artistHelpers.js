export const uploadArtistPhotoToGithub = async (file, artistId) => {
    if (!file) return null;

    // 1. Convert File ke Base64
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // 2. Tentukan Path (Hardcoded khusus Artist)
    const ext = file.name.split('.').pop();
    const path = `artists/${artistId}/${artistId}.${ext}`;

    // 3. Request ke API
    const response = await fetch('/api/github-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: base64,
            path: path,
            message: `New Artist Photo: ${artistId}`
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Artist upload failed');

    return data.url;
};