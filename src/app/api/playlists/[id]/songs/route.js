import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: playlist_id } = await params

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { song_id } = body

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 })
    }

    // Add Song to Playlist
    // RLS will ensure only owner or admin can add
    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id,
        song_id,
        added_by: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
         return NextResponse.json({ error: 'Permission denied: You cannot add songs to this playlist.' }, { status: 403 })
      }
      // Handle Duplicate Key Error (if song already in playlist, depending on constraints)
      if (error.code === '23505') {
          return NextResponse.json({ error: 'Song already in playlist' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error adding song to playlist:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: playlist_id } = await params

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { song_id } = body

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 })
    }

    // Remove Song from Playlist
    // RLS will ensure only owner or admin can remove
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .match({ playlist_id, song_id })

    if (error) {
      if (error.code === '42501') {
         return NextResponse.json({ error: 'Permission denied: You cannot remove songs from this playlist.' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Song removed from playlist' }, { status: 200 })

  } catch (error) {
    console.error('Error removing song from playlist:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
