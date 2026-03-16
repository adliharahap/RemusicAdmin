import { Disc, Smile, CloudRain, Zap, Coffee, Heart, Brain, Moon, Gamepad2, Car, PartyPopper, Flame, Volume2, CloudFog, Sunrise, Skull, Sparkles, BookOpen, Anchor, Mic2, Star, Umbrella, Activity, Speaker, Radio, Guitar, Dumbbell, Rocket, Mic, Music, Leaf, Headphones, Music2, Film, Piano, Flag, Drum, SpeakerHigh, Sun, MoonStar, User, Tv, Terminal, HandsPraying, SunMedium } from 'lucide-react';

export const MOOD_CATEGORIES = [
    {
        name: "High Energy & Hype",
        options: [
            { id: "Brazilian Phonk", icon: Speaker, desc: "Bass distorsi berat, agresif, ritme funk cepat." },
            { id: "Punk", icon: Skull, desc: "Pemberontak, tempo cepat, distorsi gitar kasar, energik." },
            { id: "Energetic", icon: Zap, desc: "Penuh tenaga, cocok untuk olahraga atau aktivitas fisik berat." },
            { id: "Party", icon: PartyPopper, desc: "Suasana pesta, klub malam, dance floor, EDM." },
            { id: "Gaming", icon: Gamepad2, desc: "Elektronik, dubstep, atau background music untuk fokus main game kompetitif." },
            { id: "DJ", icon: Disc, desc: "Remix Jedag Jedug, DJ lokal, bass boosted, asik buat goyang." },
        ]
    },
    {
        name: "Chill, Relax & Focus",
        options: [
            { id: "Relaxing", icon: Coffee, desc: "Santai, akustik, cocok untuk menemani ngopi di sore hari." },
            { id: "Chill", icon: CloudFog, desc: "Lo-fi beats, tempo lambat, suasana 'cool' dan tidak berisik." },
            { id: "Focus", icon: Brain, desc: "Meningkatkan konsentrasi, deep work, coding, minim vokal." },
            { id: "Study", icon: BookOpen, desc: "Musik latar untuk belajar, perpustakaan." },
            { id: "Reading", icon: BookOpen, desc: "Musik instrumental ringan, ambient. Cocok banget buat background pas lagi asyik baca buku." },
            { id: "Lofi Beats", icon: Headphones, desc: "Beat hip-hop lambat, suara hujan, nyaman buat background nyantai." },
            { id: "Sleep", icon: Moon, desc: "Sangat pelan, ambient, white noise, pengantar tidur nyenyak." },
        ]
    },
    {
        name: "Emotion & Romance",
        options: [
            { id: "Romance", icon: Heart, desc: "Lagu cinta, pernikahan, momen romantis bersama pasangan." },
            { id: "Sad", icon: CloudRain, desc: "Sedih, galau, patah hati, perpisahan, suasana mendung." },
            { id: "Galau Brutal", icon: CloudRain, desc: "Level sedih maksimal, nangis di pojokan kamar, gagal move on." },
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
            { id: "Epic", icon: Flame, desc: "Orkestra megah, boss fight, cinematic score yang bikin merinding." },
            { id: "Cyberpunk", icon: Terminal, desc: "Synthwave, dark techno, vibes terminal. Pas buat nemenin ricing Arch Linux atau ngoding malam." },
            { id: "Peaceful", icon: Sunrise, desc: "Damai, meditasi, yoga, suara alam." },
            { id: "Travel", icon: Car, desc: "Road trip, menyetir, liburan." },
            { id: "Live", icon: Volume2, desc: "Rekaman konser, crowd noise." },
        ]
    },
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
            { id: "Indie Senja", icon: Coffee, desc: "Folk lokal, akustik sore hari, lirik puitis soal kopi dan senja." },
            { id: "Alternative", icon: Headphones, desc: "Eksperimental, anti mainstream." },
        ]
    },
    {
        name: "Instrumental & OST",
        options: [
            { id: "Instrumental", icon: Music2, desc: "Tanpa vokal, fokus, deep work, coding." },
            { id: "Soundtrack", icon: Film, desc: "Film, game OST, cinematic." },
            { id: "Anime OST", icon: Tv, desc: "Opening/Ending song ikonik. Biar hype-nya makin kerasa pas lagi nonton." },
            { id: "Piano", icon: Piano, desc: "Piano solo, calm, emosional." },
        ]
    },
    {
        name: "Local & Cultural",
        options: [
            { id: "Pop Indonesia", icon: Flag, desc: "Musik populer Indonesia masa kini." },
            { id: "Pop Indo Jadul", icon: Radio, desc: "Tembang kenangan, pop lawas era 80an, 90an, 2000an awal." },
            { id: "Dangdut", icon: Drum, desc: "Dangdut klasik hingga modern." },
            { id: "Koplo", icon: Speaker, desc: "Dangdut koplo, remix lokal, joget." },
            { id: "Jawa", icon: Star, desc: "Campursari, Pop Jawa, Gamelan." },
            { id: "Batak", icon: Mic2, desc: "Gondang, Pop Ekstrem, Lagu Daerah Batak." },
            { id: "Aceh", icon: Sunrise, desc: "Seudati, Rapai, Nasyid Aceh." },
            { id: "Sunda", icon: Music2, desc: "Degung, Pop Sunda, Kecapi Suling." },
            { id: "Minang", icon: Radio, desc: "Saljuang, Pop Minang, Ratok." },
            { id: "Timur", icon: Guitar, desc: "Lagu Ambon, Papua, NTT, asik buat goyang." },
        ]
    },
    {
        name: "Spiritual & Religious",
        options: [
            { id: "Religius", icon: Sunrise, desc: "Lagu bertema ketuhanan, inspirasional, dan spiritual umum." },
            { id: "Sholawat & Nasyid", icon: Sunrise, desc: "Pujian Islami, sholawat nabi, nasyid, dan qasidah." },
            { id: "Mantra & Chant", icon: Sunrise, desc: "Mantra suci, chanting meditatif, musik spiritual etnik." },
            { id: "Ramadhan", icon: Sunrise, desc: "Lagu bertema bulan suci Ramadhan." },
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

export const LANGUAGE_CATEGORIES = [
    {
        name: "Asia & ASEAN",
        options: [
            { id: "id", label: "Indonesia", flag: "🇮🇩" },
            { id: "my", label: "Malaysia", flag: "🇲🇾" },
            { id: "sg", label: "Singapore", flag: "🇸🇬" },
            { id: "ph", label: "Philippines", flag: "🇵🇭" },
            { id: "th", label: "Thailand", flag: "🇹🇭" },
            { id: "vn", label: "Vietnam", flag: "🇻🇳" },
            { id: "jp", label: "Japanese", flag: "🇯🇵" },
            { id: "kr", label: "Korean", flag: "🇰🇷" },
            { id: "cn", label: "Mandarin (China)", flag: "🇨🇳" },
            { id: "tw", label: "Taiwanese", flag: "🇹🇼" },
            { id: "hk", label: "Cantonese (Hong Kong)", flag: "🇭🇰" },
            { id: "hi", label: "Hindi", flag: "🇮🇳" },
            { id: "bn", label: "Bengali", flag: "🇧🇩" },
            { id: "pa", label: "Punjabi", flag: "🇮🇳" },
            { id: "ur", label: "Urdu", flag: "🇵🇰" },
        ]
    },
    {
        name: "Local & Regional (Indonesia)",
        options: [
            { id: "jv", label: "Javanese (Jawa)", flag: "👑" },
            { id: "su", label: "Sundanese (Sunda)", flag: "🌿" },
            { id: "ms-id", label: "Minangkabau / Melayu", flag: "🐅" },
            { id: "bbc", label: "Bataknese", flag: "🎸" },
            { id: "ace", label: "Acehnese", flag: "🕌" },
            { id: "ban", label: "Balinese (Bali)", flag: "🌺" },
            { id: "tet", label: "Timur / Tetum", flag: "🌅" },
        ]
    },
    {
        name: "Europe & America",
        options: [
            { id: "en", label: "English", flag: "🇬🇧" },
            { id: "us", label: "English (US)", flag: "🇺🇸" },
            { id: "ca", label: "English (Canada)", flag: "🇨🇦" },
            { id: "es", label: "Spanish", flag: "🇪🇸" },
            { id: "mx", label: "Spanish (Mexico)", flag: "🇲🇽" },
            { id: "fr", label: "French", flag: "🇫🇷" },
            { id: "pt", label: "Portuguese", flag: "🇵🇹" },
            { id: "br", label: "Portuguese (Brazil)", flag: "🇧🇷" },
            { id: "de", label: "German", flag: "🇩🇪" },
            { id: "it", label: "Italian", flag: "🇮🇹" },
            { id: "ru", label: "Russian", flag: "🇷🇺" },
            { id: "nl", label: "Dutch", flag: "🇳🇱" },
            { id: "se", label: "Swedish", flag: "🇸🇪" },
            { id: "no", label: "Norwegian", flag: "🇳🇴" },
            { id: "fi", label: "Finnish", flag: "🇫🇮" },
        ]
    },
    {
        name: "Middle East & Others",
        options: [
            { id: "ar", label: "Arabic", flag: "🇸🇦" },
            { id: "tr", label: "Turkish", flag: "🇹🇷" },
            { id: "fa", label: "Persian (Farsi)", flag: "🇮🇷" },
            { id: "ps", label: "Palestine", flag: "🇵🇸" },
            { id: "other", label: "Other / Mixed", flag: "🌍" },
            { id: "instrumental", label: "Instrumental", flag: "🎵" },
        ]
    },
    {
        name: "Africa & Oceania",
        options: [
            { id: "za", label: "South African", flag: "🇿🇦" },
            { id: "ng", label: "Nigerian", flag: "🇳🇬" },
            { id: "eg", label: "Egyptian", flag: "🇪🇬" },
            { id: "ke", label: "Kenyan", flag: "🇰🇪" },
            { id: "au", label: "Australian", flag: "🇦🇺" },
            { id: "nz", label: "New Zealand", flag: "🇳🇿" },
        ]
    }
];
