import React, { useState } from 'react';
import { Disc, Smile, CloudRain, Zap, Coffee, Heart, Brain, Moon, Gamepad2, Car, PartyPopper, Flame, Volume2, CloudFog, Sunrise, Skull, Sparkles, BookOpen, Anchor, Mic2, Star, Umbrella, Activity, Speaker, Radio, Guitar, Dumbbell, Rocket, Mic, Music, Leaf, Headphones, Music2, Film, Piano, Flag, Drum, SpeakerHigh, Sun, MoonStar, User, Search, X } from 'lucide-react';


// --- DATABASE MOOD & GENRE VIBE ---
const MOOD_CATEGORIES = [
    // =======================
    // DATA LAMA (TIDAK DIUBAH)
    // =======================
    {
        name: "High Energy & Hype",
        options: [
            { id: "Brazilian Phonk", icon: Speaker, desc: "Bass distorsi berat, agresif, ritme funk cepat." },
            { id: "Punk", icon: Skull, desc: "Pemberontak, tempo cepat, distorsi gitar kasar, energik." },
            { id: "Energetic", icon: Zap, desc: "Penuh tenaga, cocok untuk olahraga atau aktivitas fisik berat." },
            { id: "Party", icon: PartyPopper, desc: "Suasana pesta, klub malam, dance floor, EDM." },
            { id: "Gaming", icon: Gamepad2, desc: "Elektronik, dubstep, atau background music untuk fokus main game kompetitif." },
        ]
    },
    {
        name: "Chill, Relax & Focus",
        options: [
            { id: "Relaxing", icon: Coffee, desc: "Santai, akustik, cocok untuk menemani ngopi di sore hari." },
            { id: "Chill", icon: CloudFog, desc: "Lo-fi beats, tempo lambat, suasana 'cool' dan tidak berisik." },
            { id: "Focus", icon: Brain, desc: "Meningkatkan konsentrasi, deep work, coding, minim vokal." },
            { id: "Study", icon: BookOpen, desc: "Musik latar untuk belajar, membaca buku, perpustakaan." },
            { id: "Sleep", icon: Moon, desc: "Sangat pelan, ambient, white noise, pengantar tidur nyenyak." },
        ]
    },
    {
        name: "Emotion & Romance",
        options: [
            { id: "Romance", icon: Heart, desc: "Lagu cinta, pernikahan, momen romantis bersama pasangan." },
            { id: "Sad", icon: CloudRain, desc: "Sedih, galau, patah hati, perpisahan, suasana mendung." },
            { id: "Melancholic", icon: Umbrella, desc: "Rindu mendalam, nostalgia kenangan masa lalu, sendu." },
            { id: "Sentimental", icon: Star, desc: "Menyentuh hati, emosional, drama, soundtrack kehidupan." },
            { id: "Sexy", icon: Flame, desc: "Sensual, R&B, slow jam, suasana intim." },
        ]
    },
    {
        name: "Styles & Genres",
        options: [
            { id: "Acoustic", icon: Guitar, desc: "Dominan instrumen asli (gitar/piano), organik, tanpa elektronik." },
            { id: "Jazz", icon: Mic2, desc: "Smooth, improvisasi, saxophone, piano, berkelas." },
            { id: "Classical", icon: Radio, desc: "Orkestra, piano klasik, biola, grand, timeless." },
            { id: "Groovy", icon: Disc, desc: "Bassline asik, Funk, Disco, City Pop." },
            { id: "Retro", icon: Anchor, desc: "Nuansa jadul (80s/90s), Synthwave, Vaporwave." },
        ]
    },
    {
        name: "Atmosphere",
        options: [
            { id: "Dreamy", icon: Sparkles, desc: "Mengawang, reverb tebal, Shoegaze, Dream Pop." },
            { id: "Dark", icon: Skull, desc: "Misterius, suram, Gothic, mencekam." },
            { id: "Peaceful", icon: Sunrise, desc: "Damai, meditasi, yoga, suara alam." },
            { id: "Travel", icon: Car, desc: "Road trip, menyetir, liburan." },
            { id: "Live", icon: Volume2, desc: "Rekaman konser, crowd noise." },
        ]
    },

    // =======================
    // DATA BARU (DITAMBAHKAN)
    // =======================

    {
        name: "Workout & Motivation",
        options: [
            { id: "Workout", icon: Dumbbell, desc: "Musik gym, cardio, HIIT, tempo cepat dan kuat." },
            { id: "Motivational", icon: Rocket, desc: "Uplifting, mindset booster, semangat produktif." },
        ]
    },
    {
        name: "Hip-Hop & Urban",
        options: [
            { id: "Hip-Hop", icon: Mic, desc: "Rap, trap, boom bap, urban culture." },
            { id: "R&B", icon: Music, desc: "Smooth, soulful, modern urban vibe." },
        ]
    },
    {
        name: "Rock & Metal",
        options: [
            { id: "Rock", icon: Zap, desc: "Alternative rock, indie rock, classic rock." },
            { id: "Metal", icon: Flame, desc: "Heavy metal, metalcore, agresif dan powerful." },
        ]
    },
    {
        name: "Indie & Alternative",
        options: [
            { id: "Indie", icon: Leaf, desc: "Indie pop/rock, santai, jujur, emosional." },
            { id: "Alternative", icon: Headphones, desc: "Eksperimental, anti mainstream." },
        ]
    },
    {
        name: "Instrumental & OST",
        options: [
            { id: "Instrumental", icon: Music2, desc: "Tanpa vokal, fokus, deep work, coding." },
            { id: "Soundtrack", icon: Film, desc: "Film, anime, game OST, cinematic." },
            { id: "Piano", icon: Piano, desc: "Piano solo, calm, emosional." },
        ]
    },
    {
        name: "Local & Cultural",
        options: [
            { id: "Pop Indonesia", icon: Flag, desc: "Musik populer Indonesia." },
            { id: "Dangdut", icon: Drum, desc: "Dangdut klasik hingga modern." },
            { id: "Koplo", icon: Speaker, desc: "Dangdut koplo, remix lokal, joget." },
        ]
    },
    {
        name: "Daily Mood",
        options: [
            { id: "Morning", icon: Sun, desc: "Fresh pagi hari, mood cerah." },
            { id: "Night Drive", icon: MoonStar, desc: "Nyetir malam, city lights." },
            { id: "Rainy Day", icon: CloudRain, desc: "Hujan, sendu, tenang." },
            { id: "Lonely", icon: User, desc: "Sepi, reflektif, menenangkan." },
        ]
    }
];

const LANGUAGES = [
    { id: "id", label: "Indonesia", flag: "🇮🇩" },
    { id: "en", label: "English", flag: "🇬🇧" },
    { id: "es", label: "Spanish", flag: "🇪🇸" },
    { id: "fr", label: "French", flag: "🇫🇷" },
    { id: "pt", label: "Portuguese", flag: "🇵🇹" },
    { id: "de", label: "German", flag: "🇩🇪" },
    { id: "it", label: "Italian", flag: "🇮🇹" },
    { id: "ru", label: "Russian", flag: "🇷🇺" },
    { id: "ar", label: "Arabic", flag: "🇸🇦" },
    { id: "hi", label: "Hindi", flag: "🇮🇳" },
    { id: "jp", label: "Japanese", flag: "🇯🇵" },
    { id: "kr", label: "Korean", flag: "🇰🇷" },
    { id: "mn", label: "Mandarin", flag: "🇨🇳" },
    { id: "other", label: "Other / Mixed", flag: "🌍" },
];


export default function MetadataForm({
    theme,
    title, setTitle,
    language, setLanguage,
    moods, handleMoodToggle,
    lyricsRaw, handleLyricsChange
}) {
    // State lokal untuk pencarian mood (tidak perlu dikirim ke parent)
    const [searchTerm, setSearchTerm] = useState("");

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

            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    Song Language <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.id}
                            type="button"
                            onClick={() => setLanguage(lang.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold
                                ${language === lang.id 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                    : `${theme.inputBg} border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white`
                                }
                            `}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
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
                                <Search size={32} className="mx-auto mb-2 opacity-50"/>
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