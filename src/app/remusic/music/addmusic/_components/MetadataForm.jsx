import React, { useState } from 'react';
import { Disc, Smile, CloudRain, Zap, Coffee, Heart, Brain, Moon, Gamepad2, Car, PartyPopper, Flame, Volume2, CloudFog, Sunrise, Skull, Sparkles, BookOpen, Anchor, Mic2, Star, Umbrella, Activity, Speaker, Radio, Guitar, Dumbbell, Rocket, Mic, Music, Leaf, Headphones, Music2, Film, Piano, Flag, Drum, SpeakerHigh, Sun, MoonStar, User, Search, X } from 'lucide-react';
import { LANGUAGE_CATEGORIES, MOOD_CATEGORIES } from '../../_utils/constants';


// --- DATABASE MOOD & GENRE VIBE ---


export default function MetadataForm({
    theme,
    title, setTitle,
    language, setLanguage,
    moods, handleMoodToggle, setMoods,
    lyricsRaw, handleLyricsChange,
    featuredArtists, setFeaturedArtists
}) {
    // State lokal untuk pencarian mood (tidak perlu dikirim ke parent)
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
    const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const handleAnalyzeMood = async () => {
        if (!lyricsRaw.trim()) return alert("Lyrics cannot be empty for mood analysis.");
        if (!language) return alert("Please select a Song Language first to help the AI detect precise regional moods.");

        setIsAnalyzingMood(true);
        try {
            const res = await fetch('/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'mood', text: lyricsRaw, language })
            });
            const data = await res.json();
            if (data.success && data.moods) {
                // Merge with existing moods or replace? Let's merge unique
                const newMoods = [...new Set([...moods, ...data.moods])];
                setMoods(newMoods);
            } else {
                alert("Failed to analyze mood: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error analyzing mood");
        } finally {
            setIsAnalyzingMood(false);
        }
    };

    const handleDetectLanguage = async () => {
        if (!lyricsRaw.trim()) return alert("Lyrics cannot be empty for language detection.");
        setIsDetectingLanguage(true);
        try {
            const res = await fetch('/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'language', text: lyricsRaw })
            });
            const data = await res.json();
            if (data.success && data.language) {
                setLanguage(data.language);
            } else {
                alert("Failed to detect language: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error detecting language");
        } finally {
            setIsDetectingLanguage(false);
        }
    };

    const handleTranslateLyrics = async () => {
        if (!lyricsRaw.trim()) return alert("Lyrics cannot be empty for translation.");
        setIsTranslating(true);
        try {
            const res = await fetch('/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'translate', text: lyricsRaw })
            });
            const data = await res.json();
            if (data.success && data.translation) {
                // The API now returns "[timestamp] original | translation"
                // So we just replace the whole content
                handleLyricsChange({ target: { value: data.translation } });
            } else {
                alert("Failed to translate: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error translating lyrics");
        } finally {
            setIsTranslating(false);
        }
    };

    // Logic Filtering
    const filteredCategories = MOOD_CATEGORIES.map(category => ({
        ...category,
        options: category.options.filter(option =>
            option.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.desc.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.options.length > 0); // Hapus kategori kosong

    return (
        <div className="space-y-8">
            {/* Title Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    Song Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter song title..."
                    className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold tracking-wide`}
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                        Song Language <span className="text-red-500">*</span>
                    </label>
                    <button
                        type="button"
                        onClick={handleDetectLanguage}
                        disabled={isDetectingLanguage || !lyricsRaw.trim()}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all ${isDetectingLanguage ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95'}`}
                    >
                        {isDetectingLanguage ? <><Sparkles className="animate-spin" size={12} /> Detecting...</> : <><Sparkles size={12} /> Auto Detect</>}
                    </button>
                </div>
                <div className="space-y-6">
                    {LANGUAGE_CATEGORIES.map((category) => (
                        <div key={category.name} className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest border-b border-dashed border-slate-700/50 pb-1 w-fit">
                                {category.name}
                            </h4>
                            <div className="flex flex-wrap gap-2.5">
                                {category.options.map((lang) => (
                                    <button
                                        key={lang.id}
                                        type="button"
                                        onClick={() => setLanguage(lang.id)}
                                        className={`
                                            flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-sm font-bold
                                            ${language === lang.id
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : `${theme.inputBg} ${theme.border} hover:border-indigo-400 ${theme.textMuted} hover:${theme.text} hover:bg-indigo-500/5`
                                            }
                                        `}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="text-xs md:text-sm">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Moods Selector (Grouped & Searchable) */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                        Select Moods & Vibe
                        <span className="text-[10px] font-normal lowercase opacity-50 ml-1">(Max 3 recommended)</span>
                    </label>
                    {moods.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                            {moods.length} selected
                        </span>
                    )}
                </div>

                {/* AI Analyze Button */}
                <button
                    type="button"
                    onClick={handleAnalyzeMood}
                    disabled={isAnalyzingMood}
                    className={`
                        w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                        ${isAnalyzingMood
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95'
                        }
                    `}
                >
                    {isAnalyzingMood ? (
                        <><Sparkles className="animate-spin" size={14} /> Analyzing Mood...</>
                    ) : (
                        <><Sparkles size={14} /> Analyze Mood with AI</>
                    )}
                </button>

                <div className={`rounded-2xl border ${theme.border} ${theme.cardBg} overflow-hidden`}>

                    {/* SEARCH BAR */}
                    <div className={`p-3 border-b ${theme.border} flex items-center gap-3 sticky top-0 ${theme.cardBg} z-20`}>
                        <Search size={16} className="text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari mood (contoh: 'Bass', 'Tidur', 'Sad')..."
                            className={`flex-1 bg-transparent outline-none text-sm ${theme.text} placeholder-slate-500`}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="text-slate-500 hover:text-white">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* SCROLLABLE LIST */}
                    <div className={`p-4 space-y-8 max-h-[400px] overflow-y-auto ${theme.scrollHide}`}>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <div key={category.name}>
                                    <h4 className="text-[10px] font-bold uppercase text-indigo-400 mb-3 tracking-widest border-b border-dashed border-slate-700/50 pb-1 w-fit sticky top-0 bg-inherit z-10">
                                        {category.name}
                                    </h4>
                                    {/* Grid Layout */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {category.options.map((option) => {
                                            const isSelected = moods.includes(option.id);
                                            const Icon = option.icon;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => handleMoodToggle(option.id)}
                                                    className={`
                                                        relative group flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 h-full
                                                        ${isSelected
                                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                            : `bg-transparent border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/50`
                                                        }
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                        <Icon size={18} />
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-indigo-400' : theme.text}`}>
                                                            {option.id}
                                                        </div>
                                                        <p className="text-[10px] leading-relaxed opacity-60 text-slate-950 dark:text-slate-200" >
                                                            {option.desc}
                                                        </p>
                                                    </div>

                                                    {/* Checkmark Indicator */}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 opacity-50">
                                <Search size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">Tidak ada mood yang cocok dengan "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lyrics Input */}
            <div className={`border ${theme.border} rounded-xl overflow-hidden shadow-sm`}>
                <div className={`p-3 px-4 font-semibold text-xs flex justify-between items-center ${theme.cardBg} border-b ${theme.border}`}>
                    <span className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider">
                        <Disc size={14} /> Raw Lyrics Editor
                    </span>
                    <span className="text-[10px] opacity-40">Paste LRC format here</span>
                </div>

                {/* AI Translate Button */}
                <div className={`px-4 py-2 border-b ${theme.border} ${theme.cardBg} flex justify-end`}>
                    <button
                        type="button"
                        onClick={handleTranslateLyrics}
                        disabled={isTranslating}
                        className={`
                            px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all
                            ${isTranslating
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border border-emerald-500/20'
                            }
                        `}
                    >
                        {isTranslating ? (
                            <><Sparkles className="animate-spin" size={12} /> Translating...</>
                        ) : (
                            <><Sparkles size={12} /> Translate Lyrics</>
                        )}
                    </button>
                </div>

                <textarea
                    value={lyricsRaw}
                    onChange={handleLyricsChange}
                    className={`w-full h-48 p-4 font-mono text-xs outline-none resize-none leading-relaxed ${theme.inputBg} ${theme.text} placeholder-slate-600`}
                    placeholder="[00:00.00] Paste your lyrics here..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
}