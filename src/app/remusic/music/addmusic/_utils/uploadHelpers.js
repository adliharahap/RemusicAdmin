export const uploadToGithub = async (file, id, type) => {
    if (!file) return null;
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const ext = file.name.split('.').pop();
    let path = type === 'artist_photo' ? `artists/${id}/${id}.${ext}` : `uploads/${id}/${type}_${id}.${ext}`;
    
    const response = await fetch('/api/github-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: base64, path, message: `Upload ${type} for ID ${id}` })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
};

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