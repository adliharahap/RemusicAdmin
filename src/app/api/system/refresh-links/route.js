import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Helper for concurrency control
async function mapLimit(items, limit, asyncFn) {
    const results = [];
    const executing = [];
    for (const item of items) {
        const p = Promise.resolve().then(() => asyncFn(item));
        results.push(p);
        if (limit <= items.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(results);
}

export async function POST(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const body = await req.json();
        const { ids } = body; // 'all' or array of IDs
        const botToken = process.env.BOT_TOKEN;

        if (!botToken) throw new Error("BOT_TOKEN missing");

        let songsToRefresh = [];

        if (ids === 'all') {
            const now = new Date().toISOString();
            // Limit to 50 to avoid timeout
            const { data, error } = await supabase
                .from('songs')
                .select('id, telegram_audio_file_id')
                .lt('telegram_url_expires_at', now)
                .limit(50); 
            
            if (error) throw error;
            songsToRefresh = data;
        } else if (Array.isArray(ids)) {
            const { data, error } = await supabase
                .from('songs')
                .select('id, telegram_audio_file_id')
                .in('id', ids);
            
            if (error) throw error;
            songsToRefresh = data;
        }

        if (!songsToRefresh || songsToRefresh.length === 0) {
            return NextResponse.json({ message: "No songs to refresh", count: 0 });
        }

        // Process with concurrency limit of 5
        const results = await mapLimit(songsToRefresh, 5, async (song) => {
            try {
                const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${song.telegram_audio_file_id}`, {
                    next: { revalidate: 0 }
                });
                const tgData = await tgRes.json();

                if (!tgData.ok) {
                    return { id: song.id, status: 'failed', error: tgData.description };
                }

                const filePath = tgData.result.file_path;
                const newDirectUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                
                // Set Expired 55 Menit
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 55);

                await supabase
                    .from('songs')
                    .update({
                        telegram_direct_url: newDirectUrl,
                        telegram_url_expires_at: expiresAt.toISOString()
                    })
                    .eq('id', song.id);

                return { id: song.id, status: 'success' };
            } catch (err) {
                return { id: song.id, status: 'error', error: err.message };
            }
        });

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.length - successCount;

        return NextResponse.json({
            message: "Refresh completed",
            total: results.length,
            success: successCount,
            failed: failCount,
            results
        });

    } catch (error) {
        console.error("Refresh Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
