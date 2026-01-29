import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Init Supabase with Service Role to bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const now = new Date().toISOString();
        
        // Count expired songs
        const { count, error: countError } = await supabase
            .from('songs')
            .select('*', { count: 'exact', head: true })
            .lt('telegram_url_expires_at', now);

        if (countError) throw countError;

        // Get expired songs (limit 50 for batch processing)
        const { data: expiredSongs, error: dataError } = await supabase
            .from('songs')
            .select('id, title, artists(name), telegram_url_expires_at')
            .lt('telegram_url_expires_at', now)
            .limit(50);

        if (dataError) throw dataError;

        return NextResponse.json({ 
            expired_count: count,
            expired_songs: expiredSongs,
            status: 'ok'
        });
    } catch (error) {
        console.error("Health Check Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
