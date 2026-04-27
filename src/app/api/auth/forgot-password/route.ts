import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  let body: { email?: string } = {}
  try {
    body = await request.json()
  } catch (error) {
    console.error('[API /auth/forgot-password] Invalid JSON body', error)
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[API /auth/forgot-password] Missing Supabase credentials')
    return NextResponse.json({ error: 'Configurazione server incompleta' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const originHeader = request.headers.get('origin')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://farm2you.vercel.app'
  const redirectBase = originHeader || siteUrl

  try {
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/reset-password`
    })

    if (error) {
      console.error('[API /auth/forgot-password] Supabase error:', error)
      // Non divulghiamo dettagli all'utente per motivi di sicurezza
      return NextResponse.json(
        { message: 'Se l\'email è registrata, riceverai un link per reimpostare la password.' },
        { status: 200 }
      )
    }

    return NextResponse.json({ message: 'Se l\'email è registrata, riceverai un link per reimpostare la password.' })
  } catch (error) {
    console.error('[API /auth/forgot-password] Unexpected error:', error)
    return NextResponse.json({ error: 'Impossibile inviare il link di reset in questo momento.' }, { status: 500 })
  }
}
