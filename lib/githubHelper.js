
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

/**
 * Upload content to GitHub
 * @param {string} content - Base64 encoded content
 * @param {string} path - File path in the repo
 * @param {string} message - Commit message
 * @returns {Promise<string>} - The raw URL of the uploaded file
 */
export async function uploadToGithub(content, path, message) {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        throw new Error("GitHub configuration missing");
    }

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            message: message || "Uploaded via Remusic Admin",
            content: content,
            branch: 'main'
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub Error: ${errorData.message}`);
    }

    // Return raw URL
    return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`;
}

/**
 * Delete file or folder from GitHub
 * @param {string} path - Path to file or folder
 */
export async function deleteFromGithub(path) {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        throw new Error("GitHub configuration missing");
    }

    // 1. Get content to find SHA (if file) or list (if folder)
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const getRes = await fetch(getUrl, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    if (getRes.status === 404) {
        return; // Already gone
    }

    const data = await getRes.json();
    const itemsToDelete = Array.isArray(data) ? data : [data];

    for (const item of itemsToDelete) {
        // If it's a directory, we might need to recurse, but for now we assume flat structure in the folder or just delete the files we see.
        // GitHub API returns files in the directory.
        // However, deleting a directory in GitHub API is tricky; you have to delete all files inside it.
        // The list endpoint only returns the immediate children.
        // If there are subdirectories, this simple loop won't work perfectly for deep trees, but for playlists/id/image.jpg it's fine.
        
        const deleteUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${item.path}`;
        await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                message: `Delete asset: ${item.path}`,
                sha: item.sha,
            }),
        });
    }
}
