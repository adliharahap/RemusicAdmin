import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function POST(req) {
    try {
        // 1. TERIMA DATA SEBAGAI FORM DATA (Bukan JSON)
        // Ini lebih kuat menangani file besar
        const formData = await req.formData();
        const file = formData.get('file'); // File object
        const path = formData.get('path');
        const message = formData.get('message');

        if (!file || !path) {
            return NextResponse.json({ error: 'File or path missing' }, { status: 400 });
        }

        // 2. KONVERSI FILE KE BASE64 (Manual di Server)
        // GitHub API butuh Base64, tapi kita convert di sini biar request frontend ringan
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentBase64 = buffer.toString('base64');

        // 3. REQUEST KE GITHUB API
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                message: message || "Uploaded via Remusic Admin",
                content: contentBase64,
                branch: 'main'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        const data = await response.json();
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`;

        return NextResponse.json({ success: true, url: rawUrl });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}