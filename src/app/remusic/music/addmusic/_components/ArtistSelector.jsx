import React, { useRef, useEffect, useState } from 'react';
import { Search, Plus, X, Check, Clipboard, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function ArtistSelector({
    artists, selectedArtist, setSelectedArtist,
    isCreatingArtist, setIsCreatingArtist,
    artistSearchTerm, setArtistSearchTerm, isDropdownOpen, setIsDropdownOpen,
    newArtistName, setNewArtistName,
    newArtistDesc, setNewArtistDesc,
    newArtistPhotoPreview, handleNewArtistPhotoChange,
    featuredArtists, setFeaturedArtists,
    theme
}) {
    const dropdownRef = useRef(null);
    const [tagInput, setTagInput] = useState("");
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addArtistTag();
        }
    };

    const addArtistTag = () => {
        const trimmedInput = tagInput.trim();
        if (trimmedInput && !featuredArtists.includes(trimmedInput)) {
            setFeaturedArtists([...featuredArtists, trimmedInput]);
            setTagInput('');
        }
    };

    const removeTag = (indexToRemove) => {
        setFeaturedArtists(featuredArtists.filter((_, index) => index !== indexToRemove));
    };

    const handleTextareaResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

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

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold opacity-70">Short Bio</label>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!newArtistName.trim()) return alert("Please enter an Artist Name first");
                                    setIsGeneratingBio(true);
                                    try {
                                        const res = await fetch('/api/ai-generate', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'artist_bio', text: newArtistName })
                                        });
                                        const data = await res.json();
                                        if (data.success && data.bio) {
                                            setNewArtistDesc(data.bio);
                                            // Trigger resize hack by dispatching event or just let user type
                                            setTimeout(() => {
                                                const tx = document.getElementById('artistBioTextarea');
                                                if (tx) {
                                                    tx.style.height = 'auto';
                                                    tx.style.height = tx.scrollHeight + 'px';
                                                }
                                            }, 50);
                                        } else {
                                            alert("Failed to generate bio: " + (data.error || "Unknown error"));
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Error generating bio.");
                                    } finally {
                                        setIsGeneratingBio(false);
                                    }
                                }}
                                disabled={isGeneratingBio || !newArtistName.trim()}
                                className={`text-[10px] font-bold py-1 px-2 rounded-lg flex items-center gap-1 transition-all ${isGeneratingBio ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20'}`}
                            >
                                {isGeneratingBio ? <><Sparkles className="animate-spin" size={12} /> Generating...</> : <><Sparkles size={12} /> AI Generate</>}
                            </button>
                        </div>
                        <textarea
                            id="artistBioTextarea"
                            value={newArtistDesc} onChange={(e) => setNewArtistDesc(e.target.value)}
                            onInput={handleTextareaResize}
                            className={`w-full ${theme.inputBg} border ${theme.border} rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none min-h-[64px] overflow-hidden`}
                            placeholder="Short bio..."
                            rows={1}
                        />
                    </div>
                </div>
            )}

            {/* Featured Artists Input */}
            <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    Featured Artists <span className="text-[10px] font-normal lowercase opacity-50 ml-1">(Optional - Type & Enter)</span>
                </label>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="E.g. Cardi B, DJ Khaled (Press Enter)"
                        className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-xl px-4 py-2.5 outline-none transition-all text-sm`}
                    />
                    <button
                        type="button"
                        onClick={addArtistTag}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {featuredArtists && featuredArtists.map((artist, index) => (
                        <div key={index} className="bg-indigo-500/10 text-indigo-400 pl-3 pr-1 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-500/20 transition-all">
                            <span className="mr-1">{artist}</span>

                            <div className="flex items-center gap-0.5 ml-1 opacity-70 hover:opacity-100">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newArr = [...featuredArtists];
                                            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
                                            setFeaturedArtists(newArr);
                                        }}
                                        className="p-1 hover:text-white hover:bg-indigo-500/30 rounded-full transition-colors"
                                    >
                                        <ChevronLeft size={12} strokeWidth={3} />
                                    </button>
                                )}
                                {index < featuredArtists.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newArr = [...featuredArtists];
                                            [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
                                            setFeaturedArtists(newArr);
                                        }}
                                        className="p-1 hover:text-white hover:bg-indigo-500/30 rounded-full transition-colors"
                                    >
                                        <ChevronRight size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="p-1 ml-1 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}