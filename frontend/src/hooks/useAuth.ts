import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/auth'
import type { User } from '../services/auth'

export function useAuth() {
  const queryClient = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!localStorage.getItem('access_token')) {
        return null
      }
      try {
        return await authService.getMe()
      } catch {
        return null
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}