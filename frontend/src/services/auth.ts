import { supabase } from '../lib/supabase'

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.session) {
      throw new Error('Authentication succeeded but no session was returned')
    }

    localStorage.setItem('access_token', data.session.access_token)
    if (data.session.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token)
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token || '',
      token_type: 'bearer',
    }
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  async getMe(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error(error?.message || 'Not authenticated')
    }

    return {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as string) || 'admin',
      is_active: true,
      last_login: user.last_sign_in_at || null,
      created_at: user.created_at,
    }
  },
}