export function useAuth() {
  const authUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null

  const user = authUser ? { email: authUser, role: 'admin', created_at: new Date().toISOString() } : null;

  const login = async (_data: any) => {
    // handled in LoginPage directly now
  }

  const logout = async () => {
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
  }

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingIn: false,
    isLoggingOut: false,
  }
}