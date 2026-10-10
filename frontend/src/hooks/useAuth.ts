export function useAuth() {
  const authUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null

  const user = authUser ? { email: authUser, role: 'admin' } : null;

  const login = async (data: any) => {
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