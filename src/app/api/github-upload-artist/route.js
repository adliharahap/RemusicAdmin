import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Batas ukuran file (contoh: 2MB) untuk menghindari timeout/limit serverless
const MAX_FILE_SIZE = 2 * 1024 * 1024; 
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        let filePath = formData.get('path'); // Optional path dari client
        const message = formData.get('message') || "Upload artist profile via Remusic Admin";

        // 1. Validasi Keberadaan File
        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        // 2. Validasi Tipe File (Security)
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ 
                error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` 
            }, { status: 400 });
        }

        // 3. Validasi Ukuran File (Server Stability)
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ 
                error: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
            }, { status: 400 });
        }

        // Generate path otomatis jika tidak disediakan client
        if (!filePath) {
             const uuid = randomUUID();
             const ext = 'jpg'; // Default extension for artists, or could derive from file.type
             // Format: artists/{uuid}/{uuid}.{ext}
             filePath = `artists/${uuid}/${uuid}.${ext}`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentBase64 = buffer.toString('base64');

        if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
             throw new Error("GitHub configuration missing");
        }

        // Upload ke GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                message: message,
                content: contentBase64,
                branch: 'main'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 422) {
                throw new Error("File already exists at this path. Cannot overwrite without SHA.");
            }
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        const rawUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/${filePath}`;

        return NextResponse.json({ 
            success: true, 
            url: rawUrl,
            filePath: filePath
        });

    } catch (error) {
        console.error("Artist Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}