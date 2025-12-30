import { NextResponse } from 'next/server';
import * as mm from 'music-metadata';

export async function POST(req) {
    try {
        const contentType = req.headers.get('content-type') || '';

        let metadata;
        let buffer;

        if (contentType.includes('multipart/form-data')) {
            // Handle File Upload
            const formData = await req.formData();
            const file = formData.get('file');

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            
            // Parse buffer
            metadata = await mm.parseBuffer(buffer, file.type);

        } else if (contentType.includes('application/json')) {
            // Handle URL
            const body = await req.json();
            const { url } = body;

            if (!url) {
                return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
            }

            // Fetch the stream
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
            }

            // We need to buffer it because parseStream might need random access for some formats, 
            // although parseStream exists, parseBuffer is often more reliable if we can afford the memory.
            // For large files this might be an issue, but for typical songs (3-10MB) it's fine.
            // Let's try parseStream first if possible, but music-metadata's parseStream takes a readable stream.
            // fetch response.body is a web stream, music-metadata expects Node stream.
            // Converting web stream to node stream or buffer is needed.
            // Buffer is easiest.
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            
            metadata = await mm.parseBuffer(buffer, response.headers.get('content-type'));
        } else {
            return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
        }

        // Extract relevant data
        const { common } = metadata;
        const title = common.title || '';
        const artist = common.artist || '';
        
        let cover = null;
        if (common.picture && common.picture.length > 0) {
            const pic = common.picture[0];
            cover = {
                mime: pic.format,
                data: Buffer.from(pic.data).toString('base64')
            };
        }

        return NextResponse.json({
            success: true,
            title,
            artist,
            cover
        });

    } catch (error) {
        console.error('Metadata extraction error:', error);
        return NextResponse.json({ error: error.message || 'Failed to extract metadata' }, { status: 500 });
    }
}
