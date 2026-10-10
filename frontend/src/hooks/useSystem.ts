import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'

export interface SystemStats {
  people_count: number
  embeddings_count: number
  recognition_events_count: number
  consent_granted_count: number
}

export interface SystemConfig {
  match_threshold: number
  review_threshold: number
  detection_threshold: number
  max_faces_per_image: number
  max_upload_size_mb: number
  model_pack: string
  detector_model: string
  embedder_model: string
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<SystemStats>('/system/stats')
      return response.data
    },
  })
}

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system', 'config'],
    queryFn: async () => {
      const response = await apiClient.get<SystemConfig>('/system/config')
      return response.data
    },
  })
}