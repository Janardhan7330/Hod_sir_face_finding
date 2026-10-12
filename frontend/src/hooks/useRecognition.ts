import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { RecognitionResponse, RecognitionEventSummary, RecognitionDetailResponse } from '../types/domain'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export function useRecognize() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<RecognitionResponse> => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await apiClient.postForm<RecognitionResponse>('/recognition', formData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recognition-history'] })
      queryClient.invalidateQueries({ queryKey: ['system-stats'] })
    },
  })
}

export function useRecognitionHistory(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['recognition-history', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<RecognitionEventSummary>>(`/recognition/history?page=${page}&page_size=${pageSize}`)
      return response.data
    },
  })
}

export function useRecognitionDetail(eventId: string) {
  return useQuery({
    queryKey: ['recognition', eventId],
    queryFn: async () => {
      const response = await apiClient.get<RecognitionDetailResponse>(`/recognition/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })
}

export function useDeleteRecognition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/recognition/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recognition-history'] })
    },
  })
}