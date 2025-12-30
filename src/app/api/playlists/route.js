import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { uploadToGithub } from '../../../../lib/githubHelper'

export async function POST(request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Input
    const body = await request.json()
    const { title, description, visibility, is_official, cover_image, cover_image_name } = body

    // Validate Input
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Insert Data
    // RLS will handle permission checks (e.g. preventing 'listener' from setting is_official: true)
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        title,
        description,
        visibility: visibility || 'public',
        is_official: is_official || false,
        owner_user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      // Handle RLS Policy Error (42501 is Postgres code for insufficient_privilege)
      if (error.code === '42501') {
         return NextResponse.json({ error: 'Permission denied: You cannot perform this action.' }, { status: 403 })
      }
      throw error
    }

    // Handle Cover Image Upload if present
    if (cover_image) {
        try {
            const ext = cover_image_name ? cover_image_name.split('.').pop() : 'jpg';
            const path = `playlists/${data.id}/cover.${ext}`;
            const coverUrl = await uploadToGithub(cover_image, path, `Initial cover for playlist ${data.id}`);
            
            // Update playlist with coverUrl
            const { error: updateError } = await supabase
                .from('playlists')
                .update({ cover_url: coverUrl })
                .eq('id', data.id);
            
            if (updateError) {
                console.error('Error updating playlist cover_url:', updateError);
            } else {
                data.cover_url = coverUrl;
            }
        } catch (uploadError) {
            console.error('Failed to upload cover image:', uploadError);
            // Optional: return warning or just log it. The playlist is created anyway.
        }
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
