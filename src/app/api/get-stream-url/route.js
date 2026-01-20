import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    // 1. Ambil file_id dari URL (?file_id=...)
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('file_id');

    // Validasi input
    if (!fileId) {
        return NextResponse.json({ error: 'File ID missing' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        return NextResponse.json({ error: 'Server configuration error: BOT_TOKEN missing' }, { status: 500 });
    }

    try {
        // 2. Tanya ke Telegram API: "File ID ini path-nya di mana?"
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`, {
            next: { revalidate: 3000 } 
        });

        const data = await response.json();

        // Cek jika Telegram menolak (misal ID salah atau kadaluarsa)
        if (!data.ok) {
            console.error("Telegram API Error:", data);
            return NextResponse.json({ error: 'Failed to get file from Telegram', details: data }, { status: 502 });
        }

        // 3. Ambil file_path dari respon Telegram
        const filePath = data.result.file_path;

        // 4. Susun Link Download Langsung
        // Link ini yang akan dikasih ke ExoPlayer di Android
        const streamUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // 5. Kirim balik ke Android/Browser
        return NextResponse.json({ 
            success: true, 
            url: streamUrl 
        });

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}