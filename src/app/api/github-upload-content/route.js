import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Limits
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_VIDEO_SIZE = 6 * 1024 * 1024; // 6MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        let filePath = formData.get('path'); 
        const message = formData.get('message') || "Upload music content via Remusic Admin";

        // 1. Validasi Keberadaan File
        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        // 2. Validasi Tipe & Ukuran
        let isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        let isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
             return NextResponse.json({ 
                error: `Invalid file type. Allowed: Images (JPG, PNG, WEBP) or Video (MP4)` 
            }, { status: 400 });
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ 
                error: `Image too large. Max size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` 
            }, { status: 400 });
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            return NextResponse.json({ 
                error: `Video too large. Max size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB` 
            }, { status: 400 });
        }

        // Generate path otomatis menggunakan UUID jika tidak disediakan client
        if (!filePath) {
             const uuid = randomUUID();
             const ext = file.type === 'video/mp4' ? 'mp4' : 'jpg'; // Force jpg for images usually, or derived from type
             // Format: uploads/{uuid}/{uuid}.{ext}
             filePath = `uploads/${uuid}/${uuid}.${ext}`;
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
                throw new Error("File already exists at this path or validation failed.");
            }
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        // Output URL CDN (sesuai request user)
        const rawUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/${filePath}`;

        return NextResponse.json({ 
            success: true, 
            url: rawUrl,
            filePath: filePath
        });

    } catch (error) {
        console.error("Content Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
