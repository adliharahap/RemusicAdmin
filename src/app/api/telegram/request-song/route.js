import { Telegraf } from 'telegraf';
import { NextResponse } from 'next/server';

// Inisialisasi Bot dengan token yang ada di env
// Akan throw error jika bot di-call tapi token kosong, jadi pakai opsional
const bot = process.env.BOT_TOKEN ? new Telegraf(process.env.BOT_TOKEN) : null;
const ADMIN_GROUP_ID = process.env.TELEGRAM_ADMIN_GROUP_ID;

export async function POST(req) {
    try {
        const body = await req.json();
        const { requester_name, song_title, artist_name, cover_url, preview_url } = body;

        // Validasi input minimal (judul dan artis disarankan ada)
        if (!song_title || !artist_name) {
            return NextResponse.json({ error: 'song_title and artist_name are required' }, { status: 400 });
        }

        if (!bot) {
            console.error("Telegram Webhook Error: BOT_TOKEN is missing in environment variables.");
            // Kita return 200 saja agar di Android tidak retry terus menerus kalau salah config server
            return NextResponse.json({ error: 'Server misconfigured. Bot token missing.' }, { status: 200 });
        }

        if (!ADMIN_GROUP_ID) {
            console.error("Telegram Webhook Error: TELEGRAM_ADMIN_GROUP_ID is missing.");
             return NextResponse.json({ error: 'Server misconfigured. Group ID missing.' }, { status: 200 });
        }

        // Susun pesan untuk Telegram
        const messageText = `
🎵 <b>Request Lagu Baru!</b>

👤 <b>Dari:</b> ${requester_name || 'User Anonim'}
🎤 <b>Artis:</b> ${artist_name}
🎶 <b>Lagu:</b> ${song_title}
${preview_url ? `\n🎧 <a href="${preview_url}">Klik untuk Preview Lagu</a>` : ''}
        `.trim();

        // Jika ada cover_url, kirim pakai gambar + caption. Jika tidak ada, kirim teks saja.
        if (cover_url) {
            await bot.telegram.sendPhoto(ADMIN_GROUP_ID, cover_url, {
                caption: messageText,
                parse_mode: 'HTML'
            });
        } else {
            await bot.telegram.sendMessage(ADMIN_GROUP_ID, messageText, {
                parse_mode: 'HTML'
            });
        }

        return NextResponse.json({ success: true, message: 'Notifikasi berhasil dikirim ke Telegram' });

    } catch (error) {
        console.error('Telegram Request Song API Error:', error);
        
        // Return 500 error default. (Bisa disesuaikan jika ingin silent error ke android dengan return 200)
        return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 });
    }
}
