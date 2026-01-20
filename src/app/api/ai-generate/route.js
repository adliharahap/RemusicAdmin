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
            { id: "Lonely", desc: "Sepi, reflektif, menenangkan." },
        ]
    }
];

export async function POST(req) {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not set' }, { status: 500 });
        }

        const { type, text } = await req.json();

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

If tags are missing, infer from the lyrics alone.

Here is the list of available moods and their definitions:
${moodListString}

Instructions:
1. Analyze the lyrical themes, emotional tone, and implied rhythm of the text provided.
2. Select strictly from the provided IDs. Do not invent new moods.
3. Choose the most specific moods possible (e.g., if it's very sad, choose "Sad" or "Melancholic" rather than just "Chill").
4. Return ONLY a JSON object with a "moods" key containing an array of strings matching the IDs.
5. Max 5 moods.

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
Your goal is to provide a translation that is **poetic, emotive, and flows naturally like a movie subtitle**, capturing the deep meaning without being rigid or overly abbreviated.

**CRITICAL: CONTEXT AWARENESS**
- Look for **[ar: Artist]** and **[ti: Title]** tags to understand the song's vibe.
- If no tags exist, infer from the lyrics alone.

Input Text:
"""
${text}
"""

Instructions:
1. **Format:** Keep the format EXACTLY as: 
   [timestamp] original lyrics | translated lyrics

2. **Style & Flow:**
   - **Full & Natural Sentences:** Use complete, beautiful Indonesian sentences. Do NOT aggressively shorten words (e.g., use "Aku telah" instead of "Ku t'lah", unless absolutely necessary).
   - **Subtitle Quality:** It should read like a high-quality movie subtitle: clear, touching, and easy to understand instantly.

3. **Idioms & Slang (THE MOST IMPORTANT PART):**
   - **Capture the "Attitude":** When translating slang or idioms, do not just translate the meaning. **Translate the VIBE and ATTITUDE.**
   - **Don't be afraid of length:** If a slang needs a longer phrase to sound cool and accurate in Indonesian, use it.
   - **Specific Example:** - If you see **"Keep it one hundred"**, do NOT just say "Jujur saja". Say: **"Tunjukkan dirimu yang seratus persen apa adanya"**.
     - If you see "Pyro", say "Sang penyulut api" (dramatic).

4. **Pronouns & Tone:**
   - Use "Kau" for poetic/dramatic/conflict lines.
   - Use "Kamu" for casual/soft lines.
   - Use "Aku" as the default for "I".

5. **Output:** Return ONLY the formatted lyrics.
`;
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
        } else {
            return NextResponse.json({ success: true, translation: generatedText.trim() });
        }

    } catch (error) {
        console.error("AI Generate Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
