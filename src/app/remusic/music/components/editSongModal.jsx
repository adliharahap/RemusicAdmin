import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../utils/firebase';

// --- Data Pilihan Mood ---
const moodsWithDescription = {
    "Happy": "Lagu ceria, lirik positif, beat upbeat.",
    "Sad": "Lagu mellow, lirik tentang kehilangan atau patah hati.",
    "Chill": "Lagu santai, relaxing, cocok untuk suasana tenang.",
    "Energetic": "Lagu cepat, penuh semangat, beat kencang.",
    "Romantic": "Lagu tentang cinta, penuh perasaan, bikin baper.",
    "Angry": "Lagu keras, penuh emosi, lirik marah atau beat intens.",
    "Melancholic": "Lagu sendu, bernuansa nostalgia, bikin teringat masa lalu.",
    "Confident": "Lagu swag, penuh percaya diri, vibe keren.",
    "Party": "Lagu upbeat, dance, EDM, untuk kumpul rame-rame.",
    "Epic": "Lagu megah, cinematic, seperti soundtrack film/game.",
    "Focus": "Lagu instrumental, lo-fi, atau classical untuk belajar/kerja.",
    "Hopeful": "Lagu optimis, lirik positif, vibe uplifting.",
};


// --- Komponen Ikon ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


// --- Komponen Textarea Lirik Otomatis ---
function LyricsTextarea({ formData, handleInputChange }) {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [formData?.lyrics]);

    return (
        <textarea
            ref={textareaRef}
            id="lyrics"
            name="lyrics"
            rows="1"
            className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none overflow-hidden"
            value={formData?.lyrics || ""}
            onChange={handleInputChange}
            placeholder="Masukkan lirik di sini..."
            onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
            }}
        ></textarea>
    );
}


// --- Komponen Modal Utama ---
function EditSongModal({ isOpen, onClose, song, fetched }) {
    const [formData, setFormData] = useState(song || {});
    const [selectedMoods, setSelectedMoods] = useState(song?.moods || []);
    const [coverPreview, setCoverPreview] = useState(song?.coverUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (song) {
            setFormData(song);
            setSelectedMoods(song.moods || []);
            setCoverPreview(song.coverUrl || null);
        } else {
            setFormData({});
            setSelectedMoods([]);
            setCoverPreview(null);
        }
    }, [song]);
    
    const handleEsc = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, handleEsc]);

    if (!isOpen) return null;
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'coverUrl') {
            setCoverPreview(value || null);
        }
    };

    const handleMoodToggle = (mood) => {
        setSelectedMoods(prev =>
            prev.includes(mood)
                ? prev.filter(m => m !== mood)
                : [...prev, mood]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) {
            console.error("Error: Firebase db instance is not provided to the modal.");
            return;
        }
        if (!song?.id) {
            console.error("Error: Song ID is missing, cannot update.");
            return;
        }

        setIsSaving(true);
        try {
            const songDocRef = doc(db, 'songs', song.id);
            const finalData = { ...formData, moods: selectedMoods };
            
            delete finalData.id; 

            await updateDoc(songDocRef, finalData);
            console.log("Data berhasil diperbarui untuk lagu:", song.id);
            fetched();
            onClose();
        } catch (error) {
            console.error("Gagal menyimpan data:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 text-gray-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4 transform transition-all duration-300 scale-95 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-5 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Edit Detail Lagu</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow p-6 overflow-y-auto">
                    <form id="edit-song-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Kolom Kiri: Media */}
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-400 mb-2">URL Sampul</label>
                                <img 
                                    src={coverPreview || 'https://placehold.co/600x600/1F2937/FFFFFF?text=No+Image'} 
                                    alt="Pratinjau Sampul" 
                                    className="w-full h-auto object-cover rounded-lg shadow-lg mb-3 aspect-square bg-gray-700"
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x600/1F2937/FFFFFF?text=Invalid+Image' }}
                                />
                                <input 
                                    type="url" 
                                    id="coverUrl" 
                                    name="coverUrl" 
                                    className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" 
                                    value={formData?.coverUrl || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-400 mb-2">Pemutar Audio</label>
                                <audio controls className="w-full" src={formData?.audioUrl || ''}>
                                    Your browser does not support the audio element.
                                </audio>
                                <input 
                                    type="url" 
                                    id="audioUrl" 
                                    name="audioUrl" 
                                    className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition mt-3" 
                                    value={formData?.audioUrl || ''}
                                    onChange={handleInputChange}
                                    placeholder="URL Audio"
                                />
                            </div>
                        </div>

                        {/* Kolom Kanan: Metadata */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">Judul</label>
                                <input 
                                    type="text" 
                                    id="title" 
                                    name="title" 
                                    className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" 
                                    value={formData?.title || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="artistId" className="block text-sm font-medium text-gray-400 mb-2">Artis ID</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <UserIcon />
                                    </div>
                                    <input
                                        type="text"
                                        id="artistId"
                                        name="artistId"
                                        className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        value={formData?.artistId || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="playCount" className="block text-sm font-medium text-gray-400 mb-2">Jumlah Diputar</label>
                                <div className="relative">
                                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <PlayIcon />
                                    </div>
                                    <input 
                                        type="number" 
                                        id="playCount" 
                                        name="playCount" 
                                        className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" 
                                        value={formData?.playCount || 0}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="lyrics" className="block text-sm font-medium text-gray-400 mb-2">Lirik</label>
                                <LyricsTextarea formData={formData} handleInputChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Moods</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(moodsWithDescription).map(mood => (
                                        <button
                                            key={mood}
                                            type="button"
                                            onClick={() => handleMoodToggle(mood)}
                                            title={moodsWithDescription[mood]}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                                                selectedMoods.includes(mood)
                                                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                                                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                            }`}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <footer className="flex justify-end items-center p-5 border-t border-gray-700 bg-gray-800 rounded-b-xl">
                    <button type="button" onClick={onClose} className="bg-gray-600 text-gray-200 font-semibold py-2 px-5 rounded-lg mr-3 hover:bg-gray-500 transition-colors" disabled={isSaving}>
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        form="edit-song-form" 
                        className="bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <SaveIcon />
                                Simpan
                            </>
                        )}
                    </button>
                </footer>
            </div>
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #2d3748; /* gray-800 */
                }
                ::-webkit-scrollbar-thumb {
                    background: #4a5568; /* gray-600 */
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #718096; /* gray-500 */
                }
            `}</style>
        </div>
    );
}

export default EditSongModal;

