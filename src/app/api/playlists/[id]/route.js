import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { deleteFromGithub, uploadToGithub } from '../../../../lib/githubHelper'

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete Playlist Image from GitHub
    // We do this before or parallel to DB delete. 
    // If DB delete fails, we might have deleted the image, which is acceptable (orphaned image is worse than missing image for existing playlist? No, missing image is worse).
    // Actually, if we delete image first and DB delete fails, the playlist has no image.
    // If we delete DB first and image delete fails, we have orphaned image.
    // Usually orphaned image is better than broken state.
    // But let's try to do it.
    try {
        await deleteFromGithub(`playlists/${id}`);
    } catch (ghError) {
        console.error('Failed to delete GitHub assets:', ghError);
        // Continue to delete from DB even if GitHub fails? Yes.
    }

    // Delete Playlist
    // RLS will ensure only owner or admin can delete
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '42501') {
         return NextResponse.json({ error: 'Permission denied: You cannot delete this playlist.' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Playlist deleted successfully' }, { status: 200 })

  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, visibility, cover_url, cover_image, cover_image_name } = body

    let finalCoverUrl = cover_url;

    // Handle Cover Image Upload if present
    if (cover_image) {
        try {
            const ext = cover_image_name ? cover_image_name.split('.').pop() : 'jpg';
            const path = `playlists/${id}/cover.${ext}`;
            finalCoverUrl = await uploadToGithub(cover_image, path, `Update cover for playlist ${id}`);
        } catch (uploadError) {
            console.error('Failed to upload cover image:', uploadError);
            return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 });
        }
    }

    // Update Playlist
    // RLS will ensure only owner or admin can update
    const { data, error } = await supabase
      .from('playlists')
      .update({
        title,
        description,
        visibility,
        cover_url: finalCoverUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
         return NextResponse.json({ error: 'Permission denied: You cannot update this playlist.' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
