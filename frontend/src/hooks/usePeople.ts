import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { Person, PersonCreate, PersonUpdate, ConsentUpdate, DatasetUploadResponse } from '../types/domain'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export function usePeople(page = 1, pageSize = 20, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['people', page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...filters,
      })
      const response = await apiClient.get<PaginatedResponse<Person>>(`/people?${params}`)
      return response.data
    },
  })
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const response = await apiClient.get<Person>(`/people/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonCreate) => apiClient.post<Person>('/people', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PersonUpdate }) =>
      apiClient.patch<Person>(`/people/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/people/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useUpdateConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConsentUpdate }) =>
      apiClient.post<Person>(`/people/${id}/consent`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function usePersonEmbeddings(personId: string) {
  return useQuery({
    queryKey: ['person', personId, 'embeddings'],
    queryFn: async () => {
      const response = await apiClient.get(`/people/${personId}/embeddings`)
      return response.data
    },
    enabled: !!personId,
  })
}

export function useUploadDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { persons: any[]; images: File[] }): Promise<DatasetUploadResponse> => {
      const formData = new FormData()
      formData.append('dataset_json', JSON.stringify({ persons: data.persons }))
      data.images.forEach((img) => formData.append('images', img))
      const response = await apiClient.postForm<DatasetUploadResponse>('/people/dataset/upload', formData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}