import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Inisialisasi Client
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY
});

const MOOD_CATEGORIES = [
    {
        name: "High Energy & Hype",
        options: [
            { id: "Brazilian Phonk", desc: "Bass distorsi berat, agresif, ritme funk cepat." },
            { id: "Punk", desc: "Pemberontak, tempo cepat, distorsi gitar kasar, energik." },
            { id: "Energetic", desc: "Penuh tenaga, cocok untuk olahraga atau aktivitas fisik berat." },
            { id: "Party", desc: "Suasana pesta, klub malam, dance floor, EDM." },
            { id: "Gaming", desc: "Elektronik, dubstep, atau background music untuk fokus main game kompetitif." },
        ]
    },
    {
        name: "Chill, Relax & Focus",
        options: [
            { id: "Relaxing", desc: "Santai, akustik, cocok untuk menemani ngopi di sore hari." },
            { id: "Chill", desc: "Lo-fi beats, tempo lambat, suasana 'cool' dan tidak berisik." },
            { id: "Focus", desc: "Meningkatkan konsentrasi, deep work, coding, minim vokal." },
            { id: "Study", desc: "Musik latar untuk belajar, membaca buku, perpustakaan." },
            { id: "Sleep", desc: "Sangat pelan, ambient, white noise, pengantar tidur nyenyak." },
        ]
    },
    {
        name: "Emotion & Romance",
        options: [
            { id: "Romance", desc: "Lagu cinta, pernikahan, momen romantis bersama pasangan." },
            { id: "Sad", desc: "Sedih, galau, patah hati, perpisahan, suasana mendung." },
            { id: "Melancholic", desc: "Rindu mendalam, nostalgia kenangan masa lalu, sendu." },
            { id: "Sentimental", desc: "Menyentuh hati, emosional, drama, soundtrack kehidupan." },
            { id: "Sexy", desc: "Sensual, R&B, slow jam, suasana intim." },
        ]
    },
    {
        name: "Styles & Genres",
        options: [
            { id: "Acoustic", desc: "Dominan instrumen asli (gitar/piano), organik, tanpa elektronik." },
            { id: "Jazz", desc: "Smooth, improvisasi, saxophone, piano, berkelas." },
            { id: "Classical", desc: "Orkestra, piano klasik, biola, grand, timeless." },
            { id: "Groovy", desc: "Bassline asik, Funk, Disco, City Pop." },
            { id: "Retro", desc: "Nuansa jadul (80s/90s), Synthwave, Vaporwave." },
        ]
    },
    {
        name: "Atmosphere",
        options: [
            { id: "Dreamy", desc: "Mengawang, reverb tebal, Shoegaze, Dream Pop." },
            { id: "Dark", desc: "Misterius, suram, Gothic, mencekam." },
            { id: "Peaceful", desc: "Damai, meditasi, yoga, suara alam." },
            { id: "Travel", desc: "Road trip, menyetir, liburan." },
            { id: "Live", desc: "Rekaman konser, crowd noise." },
        ]
    },
    {
        name: "Workout & Motivation",
        options: [
            { id: "Workout", desc: "Musik gym, cardio, HIIT, tempo cepat dan kuat." },
            { id: "Motivational", desc: "Uplifting, mindset booster, semangat produktif." },
        ]
    },
    {
        name: "Hip-Hop & Urban",
        options: [
            { id: "Hip-Hop", desc: "Rap, trap, boom bap, urban culture." },
            { id: "R&B", desc: "Smooth, soulful, modern urban vibe." },
        ]
    },
    {
        name: "Rock & Metal",
        options: [
            { id: "Rock", desc: "Alternative rock, indie rock, classic rock." },
            { id: "Metal", desc: "Heavy metal, metalcore, agresif dan powerful." },
        ]
    },
    {
        name: "Indie & Alternative",
        options: [
            { id: "Indie", desc: "Indie pop/rock, santai, jujur, emosional." },
            { id: "Alternative", desc: "Eksperimental, anti mainstream." },
        ]
    },
    {
        name: "Instrumental & OST",
        options: [
            { id: "Instrumental", desc: "Tanpa vokal, fokus, deep work, coding." },
            { id: "Soundtrack", desc: "Film, anime, game OST, cinematic." },
            { id: "Piano", desc: "Piano solo, calm, emosional." },
        ]
    },
    {
        name: "Local & Cultural",
        options: [
            { id: "Pop Indonesia", desc: "Musik populer Indonesia." },
            { id: "Dangdut", desc: "Dangdut klasik hingga modern." },
            { id: "Koplo", desc: "Dangdut koplo, remix lokal, joget." },
        ]
    },
    {
        name: "Daily Mood",
        options: [
            { id: "Morning", desc: "Fresh pagi hari, mood cerah." },
            { id: "Night Drive", desc: "Nyetir malam, city lights." },
            { id: "Rainy Day", desc: "Hujan, sendu, tenang." },
            { id: "Lonely", desc: "Sepi, reflMinimum 3 moods and ektif, menenangkan." },
        ]
    }
];

export async function POST(req) {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not set' }, { status: 500 });
        }

        const { type, text, language } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        let prompt = "";
        let responseSchema = null;

        if (type === 'mood') {

            const moodListString = MOOD_CATEGORIES.map(category => {
                const optionsList = category.options.map(opt => `- "${opt.id}": ${opt.desc}`).join("\n");
                return `Category: ${category.name}\n${optionsList}`;
            }).join("\n\n");

            prompt = `
You are an expert music curator and mood analyst.
Analyze the following lyrics/text and identify the most relevant moods based on the specific definitions provided below.

**CRITICAL STEP: READ METADATA TAGS FIRST**
The input text may contain standard LRC tags. You MUST parse them to understand the context:
- Look for **[ar: Artist Name]** to identify the artist and their typical musical style (Genre, Vibe).
- Look for **[ti: Song Title]** to identify the song context.
- Look for **[al: Album Name]** for era/album context.

**LANGUAGE CONTEXT:** The user has selected the language ID "${language || 'unknown'}".
**STRICT RULES FOR INDONESIAN REGIONAL MUSIC:**
- If the language is "id" (Pop Indonesia), DO NOT SELECT regional moods like "Jawa", "Batak", "Sunda", "Minang", "Aceh", or "Timur". Select "Pop Indonesia" or "Dangdut" / "Koplo" instead.
- If the language is a regional one (e.g. "jv" Jawa, "su" Sunda, "bbc" Bataknese, "ace" Acehnese, "ms-id" Minangkabau, "tet" Timur), you MUST SELECT the corresponding regional mood (e.g. "Jawa", "Sunda", "Batak", "Aceh", "Minang", "Timur") and DO NOT SELECT "Pop Indonesia".

Here is the list of available moods and their definitions:
${moodListString}

Instructions:
1. Analyze the lyrical themes, emotional tone, and implied rhythm of the text provided.
2. Select strictly from the provided IDs. Do not invent new moods.
3. Choose the most specific moods possible.
4. Return ONLY a JSON object with a "moods" key containing an array of strings matching the IDs.
5. Max 10 moods but you can choose less if you think it's not necessary.

Text to Analyze:
"${text}"
`;
            responseSchema = {
                type: "OBJECT",
                properties: {
                    moods: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                }
            };
        } else if (type === 'translate') {
            prompt = `
You are an expert song translator and lyricist specializing in translating English songs to Indonesian. 
Your goal is to provide a translation that is **natural, emotive, and flows like a subtitle**, capturing the deep meaning without being overly formal or excessively poetic/cringey.

**CRITICAL: EMPTY LINES IN LRC**
- If an input line is just a timestamp with NO lyrics (e.g. "[09:00.00]"), you MUST output it EXACTLY as is: "[09:00.00]".
- DO NOT add a "|" or any text to empty lines. This will break the app's lyric parser.

Input Text:
"""
${text}
"""

Instructions:
1. **Format:** Keep the format EXACTLY as: 
   [timestamp] original lyrics | translated lyrics
   (Unless the line is empty, then just return the empty timestamp line).

2. **Style & Flow:**
   - **Full & Natural Sentences:** Use complete Indonesian sentences. Do NOT use overly abbreviated slang words (e.g., NEVER use "tuk" for "untuk", "kumau" for "aku mau" - spell them out naturally but casually).
   - **Not Too Poetic:** Do not use overly dramatic or ancient poetic words. Use modern, relatable conversational Indonesian.

3. **Pronouns & Tone (CRITICAL):**
   - For relaxed, romantic, chill, or everyday songs, use **"kamu"** instead of "kau". Use "kau" ONLY if the song is extremely aggressive or deeply dramatic.
   - Use **"aku"** instead of "ku".

4. **Idioms & Slang:**
   - Translate the VIBE and ATTITUDE, not just literal words. 

5. **Output:** Return ONLY the formatted lyrics.
`;
        } else if (type === 'artist_bio') {
            prompt = `
You are an expert music journalist and Wikipedia editor.
Write a short, engaging, and professional biography in Indonesian for the musical artist/band: "${text}".
If the artist is well-known, provide factual background information (genre, origins, notable works).
If the artist is not well-known, provide a generic but professional-sounding bio based on their name or genre.

Instructions:
1. Keep it under 3-4 sentences (Short Bio).
2. Write in Indonesian.
3. Return ONLY the biography text. Do not include any formatting or introductions.
`;
        } else if (type === 'language') {
            prompt = `
You are an expert linguist and music language detector.
Analyze the following lyrics/text and determine its PRIMARY spoken language. 
Consider tags like [ar: Artist] or [ti: Title] if present, but focus on the lyrics.

Choose EXACTLY ONE ID from this list of supported languages:
- "id" (Indonesian)
- "my" (Malaysian)
- "en" (English)
- "us" (English US)
- "es" (Spanish)
- "fr" (French)
- "de" (German)
- "it" (Italian)
- "ru" (Russian)
- "jp" (Japanese)
- "kr" (Korean)
- "cn" (Mandarin)
- "ar" (Arabic)
- "th" (Thai)
- "vn" (Vietnamese)
- "ph" (Filipino/Tagalog)
- "hi" (Hindi)
- "jv" (Javanese / Jawa)
- "su" (Sundanese / Sunda)
- "ms-id" (Minangkabau / Melayu)
- "bbc" (Bataknese)
- "ace" (Acehnese)
- "ban" (Balinese)
- "tr" (Turkish)
- "pt" (Portuguese)
- "other" (If it clearly does not belong to any above)

Return ONLY a JSON object with a "language" key containing the chosen ID string.

Input Text:
"${text}"
`;
            responseSchema = {
                type: "OBJECT",
                properties: {
                    language: { type: "STRING" }
                }
            };
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const generateConfig = {
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        };

        if (responseSchema) {
            generateConfig.config = {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            };
        }

        let response;
        try {
            response = await ai.models.generateContent(generateConfig);
        } catch (e) {
            // Fallback if 2.5-flash fails (e.g. 503 Overloaded or 404 Not Found)
            console.warn("Primary model failed, retrying with gemini-1.5-flash:", e.message);
            generateConfig.model = "gemini-1.5-flash";
            response = await ai.models.generateContent(generateConfig);
        }
        
        // Fix: Access .text property directly based on user example/SDK version
        const generatedText = response.text;

        if (!generatedText) {
             throw new Error("No text returned from AI");
        }

        if (type === 'mood') {
            try {
                // Clean up potential markdown code blocks if present
                const cleanText = generatedText.replace(/```json|```/g, '').trim();
                const jsonResponse = JSON.parse(cleanText);
                return NextResponse.json({ success: true, moods: jsonResponse.moods });
            } catch (e) {
                console.error("Failed to parse JSON from Gemini:", generatedText);
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
            }
        } else if (type === 'language') {
            try {
                const cleanText = generatedText.replace(/```json|```/g, '').trim();
                const jsonResponse = JSON.parse(cleanText);
                return NextResponse.json({ success: true, language: jsonResponse.language });
            } catch (e) {
                return NextResponse.json({ error: 'Failed to parse language from AI' }, { status: 500 });
            }
        } else if (type === 'artist_bio') {
            return NextResponse.json({ success: true, bio: generatedText.trim() });
        } else {
            return NextResponse.json({ success: true, translation: generatedText.trim() });
        }

    } catch (error) {
        console.error("AI Generate Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
