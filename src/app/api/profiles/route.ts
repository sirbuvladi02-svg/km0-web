import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    console.error('[API /profiles] Missing Supabase URL or credentials')
    return NextResponse.json(
      { error: 'Server configuration error: missing Supabase credentials' },
      { status: 500 }
    )
  }

  if (!serviceRoleKey) {
    console.warn('[API /profiles] Service role key assente, uso ANON key (subject to RLS)')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey || anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')
  const ids = idsParam
    ? idsParam.split(',').map(id => id.trim()).filter(Boolean)
    : []

  let query = admin
    .from('profiles')
    .select('id, farm_name, full_name, avatar_url, phone, bio')

  if (ids.length > 0) {
    query = query.in('id', ids)
  }

  const { data, error } = await query

  if (error) {
    console.error('[API /profiles] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const profilesMap: Record<string, any> = {}
  data?.forEach(profile => {
    profilesMap[profile.id] = profile
  })

  return NextResponse.json({ profiles: profilesMap, count: data?.length ?? 0 })
}
