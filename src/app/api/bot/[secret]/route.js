// src/app/api/bot/[secret]/route.js
import { Telegraf } from 'telegraf';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Init Supabase (Service Role)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Init Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// 🛠️ HELPER: BERSIHKAN TEKS DARI SIMBOL HTML (PENTING!)
const escapeHTML = (str) => {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

async function processAudio(ctx, message) {
    try {
        const audio = message.audio;
        if (!audio) return;

        const fileId = audio.file_id;
        
        // Ambil data mentah
        let rawFileName = audio.file_name || "Unknown.mp3";
        let rawTitle = audio.title || "No Title";
        let rawPerformer = audio.performer || "No Artist";
        
        // BERSIHKAN TEXT (Escape HTML) SEBELUM MASUK STRING
        const fileName = escapeHTML(rawFileName);
        const title = escapeHTML(rawTitle);
        const performer = escapeHTML(rawPerformer);

        const fileSizeMB = (audio.file_size / 1024 / 1024).toFixed(2);

        // A. Cek Database Supabase
        const { data: existingSong } = await supabase
            .from('songs')
            .select('id, title')
            .eq('telegram_audio_file_id', fileId)
            .single();

        let statusDb = "❌ <b>BELUM ADA DI DATABASE</b>";
        let songIdDb = "-";

        if (existingSong) {
            statusDb = "✅ <b>SUDAH TERDAFTAR</b>";
            songIdDb = existingSong.id;
        }

        // B. Susun Pesan Balasan (Aman karena sudah di-escape)
        const replyText = `
🎧 <b>INFO FILE AUDIO</b>

📂 <b>File:</b> ${fileName}
🎵 <b>Judul:</b> ${title}
🎤 <b>Artis:</b> ${performer}
💾 <b>Size:</b> ${fileSizeMB} MB

👇 <b>TELEGRAM FILE ID (Copy Ini):</b>
<code>${fileId}</code>

🗄 <b>Status DB:</b> ${statusDb}
🆔 <b>UUID:</b> <code>${songIdDb}</code>
        `;

        // C. Kirim Balasan
        await ctx.replyWithHTML(replyText, { 
            reply_to_message_id: message.message_id 
        });

    } catch (e) {
        console.error("Gagal memproses audio:", e);
        // Fallback: Kalau masih error HTML, kirim text polos aja biar bot gak diem doang
        try {
            await ctx.reply(`⚠️ Gagal format HTML. Info Raw:\nFile ID: ${message.audio.file_id}`);
        } catch (err) {}
    }
}

// ============================================================
// 🤖 EVENT LISTENERS (OTAK BOT)
// ============================================================

// 1. HANDLER CHANNEL POST (Upload di Channel -> Langsung Balas)
// Ini fitur yang kamu mau pertahankan
bot.on('channel_post', async (ctx) => {
    // Cek apakah pesan berisi audio
    if (ctx.channelPost.audio) {
        await processAudio(ctx, ctx.channelPost);
    }
});

// 2. HANDLER PRIVATE MESSAGE (Forward/Chat ke Bot -> Balas Juga)
// Ini fitur untuk recovery/cek ID manual
bot.on('message', async (ctx) => {
    const message = ctx.message;

    // A. Jika Audio (Forwardan atau Upload Langsung)
    if (message.audio) {
        await processAudio(ctx, message);
        return;
    }

    // B. Fitur /infomusic (CSV Generator)
    // Saya masukkan sekalian biar lengkap
    if (message.text === '/infomusic') {
        ctx.reply("⏳ Sedang mengambil data dari database...");
        // Logika CSV bisa dimasukkan di sini jika perlu nanti
        // Untuk sekarang kita kasih info simple dulu
        const { count } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        ctx.reply(`📊 Total Lagu di Database: ${count || 0}`);
    }
});


// ============================================================
// 🚀 ROUTE HANDLER (NEXT.JS STANDARD)
// ============================================================
export async function POST(req, { params }) {
    // 1. Await params (Aturan Next.js 15)
    const { secret } = await params;

    // 2. Validasi Keamanan (Biar gak ditembak sembarang orang)
    // Pastikan SECRET_PATH di env sama dengan URL Webhook kamu
    if (secret !== process.env.SECRET_PATH) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        
        // Serahkan data ke Telegraf untuk diproses
        await bot.handleUpdate(body);
        
        return NextResponse.json({ message: 'OK' });
    } catch (error) {
        console.error('Bot Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const { secret } = await params;
    if (secret !== process.env.SECRET_PATH) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ status: 'Bot Listening...' });
}