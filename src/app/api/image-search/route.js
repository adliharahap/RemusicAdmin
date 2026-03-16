import { NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let isInitialized = false;

async function ensureInitialized() {
    if (!isInitialized) {
        await ytmusic.initialize();
        isInitialized = true;
    }
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'album'; // 'album' or 'artist'
    const proxyUrl = searchParams.get('proxy');

    // --- PROXY MODE ---
    if (proxyUrl) {
        try {
            const imageRes = await fetch(proxyUrl);
            if (!imageRes.ok) throw new Error('Failed to fetch image');
            
            const arrayBuffer = await imageRes.arrayBuffer();
            const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        } catch (error) {
            console.error('Image proxy error:', error);
            return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
        }
    }

    // --- SEARCH MODE ---
    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        await ensureInitialized();

        // --- 1. SEARCH YOUTUBE MUSIC ---
        let ytResults = [];
        try {
            if (type === 'artist') {
                const results = await ytmusic.searchArtists(query);
                ytResults = results.map(item => ({
                    id: `yt_${item.artistId}`,
                    name: item.name,
                    image: item.thumbnails && item.thumbnails.length > 0 
                        ? item.thumbnails[item.thumbnails.length - 1].url 
                        : null,
                    type: 'artist',
                    source: 'YouTube Music'
                }));
            } else {
                const results = await ytmusic.searchSongs(query);
                ytResults = results.map(item => {
                    // Extract artist name string safely
                    let artistName = 'Unknown Artist';
                    if (typeof item.artist === 'string') artistName = item.artist;
                    else if (item.artist && item.artist.name) artistName = item.artist.name;

                    return {
                        id: `yt_${item.videoId || item.songId}`,
                        name: item.name,
                        artist: artistName,
                        image: item.thumbnails && item.thumbnails.length > 0 
                            ? item.thumbnails[item.thumbnails.length - 1].url.replace(/w\d+-h\d+/, 'w800-h800') 
                            : null,
                        type: 'song',
                        source: 'YouTube Music'
                    };
                });
            }
        } catch (e) {
            console.error("YTMusic Search Error:", e);
        }

        // --- 2. SEARCH ITUNES/DEEZER ---
        let otherResults = [];
        try {
            let entity = (type === 'artist') ? 'musicArtist' : 'song';
            const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=15`;
            const itRes = await fetch(itunesUrl);
            const itData = await itRes.json();

            otherResults = itData.results.map(item => {
                if (type === 'artist') {
                    return {
                        id: `it_${item.artistId}`,
                        name: item.artistName,
                        image: null, 
                        type: 'artist',
                        source: 'iTunes'
                    };
                } else {
                    return {
                        id: `it_${item.collectionId || item.trackId}`,
                        name: item.collectionName || item.trackName,
                        artist: item.artistName,
                        image: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
                        type: 'song',
                        source: 'iTunes'
                    };
                }
            });

            // Deezer Fallback / Addition
            let dzEndpoint = 'track';
            if (type === 'artist') dzEndpoint = 'artist';
            else if (type === 'album') dzEndpoint = 'album';

            const dzUrl = `https://api.deezer.com/search/${dzEndpoint}?q=${encodeURIComponent(query)}&limit=10`;
            const dzRes = await fetch(dzUrl);
            const dzData = await dzRes.json();
            
            if (dzData.data) {
                dzData.data.forEach(item => {
                    otherResults.push({
                        id: `dz_${item.id}`,
                        name: item.title || item.name,
                        artist: item.artist?.name,
                        image: item.cover_xl || item.picture_xl || item.cover_big || item.picture_big,
                        type: (type === 'artist') ? 'artist' : (type === 'album' ? 'album' : 'song'),
                        source: 'Deezer'
                    });
                });
            }
        } catch (e) {
            console.error("Other API Search Error:", e);
        }

        // Filter out results without images
        const filterFn = item => !!item.image;
        const finalYt = ytResults.filter(filterFn);
        const finalOther = otherResults.filter(filterFn);

        return NextResponse.json({ 
            ytmusic: finalYt,
            other: finalOther
        });
    } catch (error) {
        console.error('General search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
