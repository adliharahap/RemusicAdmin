// src/app/api/bot/[secret]/route.js
import { Telegraf } from 'telegraf';
import { NextResponse } from 'next/server';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Logic Bot (Sama kyk tadi)
bot.on('channel_post', async (ctx) => {
    const message = ctx.channelPost;
    if (message.audio) {
        const fileId = message.audio.file_id;
        const fileName = message.audio.file_name || "Unknown";
        const title = message.audio.title || "No Title";

        const replyText = `
🎵 <b>Lagu Terdeteksi!</b>
📂 File: ${fileName}
🎼 Judul: ${title}

👇 <b>COPY ID INI:</b>
<code>${fileId}</code>
        `;
        try {
            await ctx.replyWithHTML(replyText, { reply_to_message_id: message.message_id });
        } catch (e) {
            console.error("Gagal reply:", e);
        }
    }
});

// HANDLER UTAMA
export async function POST(req, { params }) {
    // 1. Await params terlebih dahulu (Aturan Next.js 15)
    const { secret } = await params;

    // 2. Validasi Keamanan
    if (secret !== process.env.SECRET_PATH) {
        return NextResponse.json({ error: 'Salah alamat bos!' }, { status: 401 });
    }

    try {
        const body = await req.json();
        await bot.handleUpdate(body);
        return NextResponse.json({ message: 'OK' });
    } catch (error) {
        console.error('Bot Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const { secret } = await params; // Await di sini juga
    
    if (secret !== process.env.SECRET_PATH) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ status: 'Bot Aktif & Aman!' });
}