import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wfbwsrcpujhsihgoveso.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYndzcmNwdWpoc2loZ292ZXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDE1MjcsImV4cCI6MjA4NzE3NzUyN30.f7KVYVCpZWFCqdVShfhgz6RFNR9HppK07eHo7DzQBSk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
