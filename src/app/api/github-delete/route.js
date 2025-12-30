// src/app/api/github-delete/route.js
import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = process.env.GITHUB_OWNER; 
const REPO_NAME = process.env.GITHUB_REPO;     

export async function DELETE(request) {
    try {
        const { path } = await request.json(); // path = "playlists/uuid-123"

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // 1. Cek isi folder/file tersebut untuk mendapatkan SHA
        // GitHub API: GET /repos/{owner}/{repo}/contents/{path}
        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        
        const getRes = await fetch(getUrl, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (getRes.status === 404) {
            // File/Folder sudah tidak ada, anggap sukses
            return NextResponse.json({ message: 'File not found, nothing to delete' });
        }

        const data = await getRes.json();

        const itemsToDelete = Array.isArray(data) ? data : [data];

        for (const item of itemsToDelete) {
            const deleteUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${item.path}`;
            
            await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                body: JSON.stringify({
                    message: `Delete playlist asset: ${item.path}`,
                    sha: item.sha, // WAJIB ADA SHA UNTUK DELETE
                }),
            });
        }

        return NextResponse.json({ success: true, message: 'Deleted successfully' });

    } catch (error) {
        console.error('GitHub Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}