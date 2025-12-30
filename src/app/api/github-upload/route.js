import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Tanpa NEXT_PUBLIC
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function POST(req) {
    try {
        // 1. Terima data dari Frontend
        const { content, path, message } = await req.json();

        if (!content || !path) {
            return NextResponse.json({ error: 'Data incomplete' }, { status: 400 });
        }

        // 2. Request ke GitHub API (Server to Server)
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                message: message || "Uploaded via Remusic Admin",
                content: content, // Base64 string
                branch: 'main' // Sesuaikan branch
            })
        });

        // Cek Error dari GitHub
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        const data = await response.json();

        // 3. Kembalikan URL Raw (agar bisa langsung diakses sbg gambar)
        // Gunakan RawGit atau jsDelivr atau raw.githubusercontent
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`;

        return NextResponse.json({ success: true, url: rawUrl });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}