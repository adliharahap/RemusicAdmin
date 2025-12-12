// lib/supabaseClientUpload.js
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ JADIKAN CONST (SINGLETON), JANGAN FUNCTION
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)