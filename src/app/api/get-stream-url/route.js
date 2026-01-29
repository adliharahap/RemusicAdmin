import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// --- 🔥 LOGIKA RATE LIMITER (In-Memory) ---
// Kita simpan data request di RAM sementara server hidup.
// Format: Map<IP_Address, { count: number, lastReset: timestamp }>
const rateLimitMap = new Map();

function checkRateLimit(ip) {
    const limit = 10; // Maksimal 10 request
    const windowMs = 1000; // Per 1 detik (1000 ms)

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, lastReset: Date.now() });
        return true; // Lolos
    }

    const record = rateLimitMap.get(ip);
    const now = Date.now();

    if (now - record.lastReset > windowMs) {
        // Kalau sudah lewat 1 detik, reset hitungan
        record.count = 1;
        record.lastReset = now;
        return true; // Lolos
    }

    if (record.count >= limit) {
        return false; // 🚫 DITOLAK (Kebanyakan spam)
    }

    record.count++;
    return true; // Lolos
}
// ------------------------------------------

export async function GET(req) {
    
    // 1. 👮‍♂️ DUAL AUTHENTICATION STRATEGY
    // Cek Header Secret (untuk Android/External) atau Session Cookie (untuk Admin Dashboard)
    
    const headerSecret = req.headers.get('x-remusic-secret');
    const serverSecret = process.env.APP_SECRET;
    let isAuthorized = false;

    // A. Cek Secret Key
    if (headerSecret === serverSecret) {
        isAuthorized = true;
    } else {
        // B. Cek Session Cookie (Admin Dashboard)
        const cookieStore = await cookies();
        
        // Kita butuh client Supabase untuk cek session
        // Note: Kita inisialisasi client khusus auth check di sini
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Pakai Anon Key buat cek session user
            {
                cookies: {
                    get(name) { return cookieStore.get(name)?.value; },
                    set(name, value, options) {},
                    remove(name, options) {},
                },
            }
        );

        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (user) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json(
            { error: 'Eits, mau ngapain bang? (Unauthorized Access)' }, 
            { status: 401 }
        );
    }
    // 1. 👮‍♂️ CEK POLISI: Rate Limit Check
    // Ambil IP Asli User (Penting buat deteksi siapa yang nyerang)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    if (!checkRateLimit(ip)) {
        console.warn(`⛔ SPAM DETECTED from IP: ${ip}`);
        return NextResponse.json(
            { error: 'Woi santai dong! Terlalu banyak request (Rate Limit Exceeded).' }, 
            { status: 429 } // Kode HTTP Resmi buat "Lu Kena Spam"
        );
    }

    // --- LOGIKA UTAMA (Sama kayak sebelumnya) ---
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get('song_id');
    const fileId = searchParams.get('file_id');

    if (!songId || !fileId) {
        return NextResponse.json({ error: 'Missing song_id or file_id' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        return NextResponse.json({ error: 'Server config error: BOT_TOKEN missing' }, { status: 500 });
    }

    // Init Supabase Admin (Service Role)
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY, 
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
                set(name, value, options) {},
                remove(name, options) {},
            },
        }
    );

    try {
        // --- LOGIKA CERDAS: CEK SUPABASE DULU ---
        const { data: currentData } = await supabase
            .from('songs')
            .select('telegram_direct_url, telegram_url_expires_at')
            .eq('id', songId)
            .single();

        // Cek Expired
        if (currentData && currentData.telegram_direct_url) {
            const expiredAt = new Date(currentData.telegram_url_expires_at).getTime();
            const now = Date.now();
            
            // Jika masih ada sisa waktu > 5 menit, PAKAI CACHE!
            if (expiredAt > now + (5 * 60 * 1000)) { 
                return NextResponse.json({
                    success: true,
                    source: '⚡ DATABASE (Supabase Cache)',
                    url: currentData.telegram_direct_url,
                    expires_at: currentData.telegram_url_expires_at
                });
            }
        }

        // --- JIKA DATA BASI: HIT TELEGRAM ---
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`, {
            next: { revalidate: 0 }
        });
        const tgData = await tgRes.json();

        if (!tgData.ok) {
            // console.error("Telegram API Error:", tgData); <-- Opsional, biar log gak penuh
            return NextResponse.json({ error: 'Failed to get file from Telegram', details: tgData }, { status: 502 });
        }

        const filePath = tgData.result.file_path;
        const newDirectUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Set Expired 55 Menit
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 55);

        // Update Database
        await supabase
            .from('songs')
            .update({
                telegram_direct_url: newDirectUrl,
                telegram_url_expires_at: expiresAt.toISOString()
            })
            .eq('id', songId);

        return NextResponse.json({ 
            success: true, 
            source: '🌍 API (Telegram Fetch)',
            url: newDirectUrl,
            expires_at: expiresAt.toISOString()
        });

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}