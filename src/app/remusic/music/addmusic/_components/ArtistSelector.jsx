import React, { useRef, useEffect } from 'react';
import { Search, Plus, X, Check, Clipboard } from 'lucide-react';

export default function ArtistSelector({
    artists, selectedArtist, setSelectedArtist,
    isCreatingArtist, setIsCreatingArtist,
    artistSearchTerm, setArtistSearchTerm, isDropdownOpen, setIsDropdownOpen,
    newArtistName, setNewArtistName,
    newArtistDesc, setNewArtistDesc,
    newArtistPhotoPreview, handleNewArtistPhotoChange,
    theme
}) {
    const dropdownRef = useRef(null);

    // Filter logic
    const filteredArtists = artists.filter(artist =>
        artist.name.toLowerCase().includes(artistSearchTerm.toLowerCase())
    );

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsDropdownOpen]);

    const selectArtist = (artist) => {
        setSelectedArtist(artist);
        setArtistSearchTerm(artist.name);
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold block opacity-70">Artist <span className="text-red-500">*</span></label>
                <button
                    type="button"
                    onClick={() => setIsCreatingArtist(!isCreatingArtist)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                    {isCreatingArtist ? "Select Existing" : "+ Create New"}
                </button>
            </div>

            {!isCreatingArtist ? (
                // MODE SELECT
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                        <input
                            type="text"
                            value={artistSearchTerm}
                            onChange={(e) => { setArtistSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="Search artist..."
                            className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl pl-10 pr-10 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm`}
                        />
                        {selectedArtist && (
                            <div className="absolute right-3 top-2.5">
                                <img src={selectedArtist.photo_url} className="w-6 h-6 rounded-full object-cover border border-indigo-500" />
                            </div>
                        )}
                    </div>

                    {isDropdownOpen && (
                        <div className={`absolute z-50 w-full mt-2 rounded-xl border ${theme.border} ${theme.cardBg} shadow-2xl max-h-60 overflow-y-auto ${theme.scrollHide}`}>
                            {filteredArtists.length > 0 ? (
                                filteredArtists.map(artist => (
                                    <div
                                        key={artist.id}
                                        onClick={() => selectArtist(artist)}
                                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors border-b ${theme.border} last:border-0`}
                                    >
                                        <img src={artist.photo_url || "https://placehold.co/50"} className="w-10 h-10 rounded-full object-cover bg-slate-800" />
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-bold ${selectedArtist?.id === artist.id ? 'text-indigo-400' : ''}`}>{artist.name}</div>
                                        </div>
                                        {selectedArtist?.id === artist.id && <Check size={16} className="text-indigo-400" />}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs opacity-50">
                                    Artist not found. <br />
                                    <button onClick={() => setIsCreatingArtist(true)} className="text-indigo-400 hover:underline mt-1">Create "{artistSearchTerm}"?</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // MODE CREATE
                <div className={`p-4 rounded-xl border border-indigo-500/50 bg-indigo-500/5 space-y-4`}>
                    <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2 mb-2">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1"><Plus size={12} /> New Artist Details</span>
                        <button onClick={() => setIsCreatingArtist(false)} className="text-xs opacity-50 hover:opacity-100"><X size={14} /></button>
                    </div>

                    <input
                        type="text" value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)}
                        className={`w-full ${theme.inputBg} border ${theme.border} rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none`}
                        placeholder="Artist Name"
                    />

                    <div className="flex gap-3 items-center">
                        {newArtistPhotoPreview && <img src={newArtistPhotoPreview} className="w-10 h-10 rounded-full object-cover border border-slate-600" />}
                        <div className="relative w-full flex gap-2">
                            <input
                                type="file" accept="image/*" onChange={handleNewArtistPhotoChange}
                                className={`block w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer ${theme.inputBg} rounded-lg border ${theme.border}`}
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const clipboardItems = await navigator.clipboard.read();
                                        for (const item of clipboardItems) {
                                            if (item.types.some(type => type.startsWith('image/'))) {
                                                const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                                                const file = new File([blob], "pasted_artist.png", { type: blob.type });
                                                handleNewArtistPhotoChange(file);
                                                return;
                                            }
                                        }
                                        alert("No image found in clipboard");
                                    } catch (err) {
                                        console.error(err);
                                        alert("Failed to read clipboard. Please allow permissions.");
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.inputBg} hover:bg-slate-800 transition-colors text-indigo-400`}
                                title="Paste from Clipboard"
                            >
                                <Clipboard size={14} />
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={newArtistDesc} onChange={(e) => setNewArtistDesc(e.target.value)}
                        className={`w-full ${theme.inputBg} border ${theme.border} rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-16`}
                        placeholder="Short bio..."
                    />
                </div>
            )}
        </div>
    );
}