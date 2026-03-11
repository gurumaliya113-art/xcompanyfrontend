import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecjxynuccpncwsogezos.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanh5bnVjY3BuY3dzb2dlem9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTQ1MjMsImV4cCI6MjA4NTc3MDUyM30.UJcsapv2REDm-RD4L0s3PkenmJ7NE0rHMeDVAA94qzM'

export const SUPABASE_CONFIGURED = !!supabaseAnonKey
export const supabase = SUPABASE_CONFIGURED ? createClient(supabaseUrl, supabaseAnonKey) : null

export function getSupabase() {
  if (!SUPABASE_CONFIGURED || !supabase) {
    throw new Error('Supabase is not configured.')
  }
  return supabase
}
