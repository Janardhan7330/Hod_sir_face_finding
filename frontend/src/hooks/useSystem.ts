import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { SystemStats, SystemConfig } from '../types/domain'

export type { SystemStats, SystemConfig }

export function useSystemStats() {
  return useQuery({
    queryKey: ['system', 'stats'],
    queryFn: async (): Promise<SystemStats> => {
      const [
        { count: studentsCount },
        { count: profilesCount },
        { count: attendanceCount },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('student_face_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true }),
      ])

      const people = studentsCount || 0
      const profiles = profilesCount || 0
      const events = attendanceCount || 0

      return {
        people_count: people,
        embeddings_count: profiles,
        recognition_events_count: events,
        consent_granted_count: people,
      }
    },
  })
}

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system', 'config'],
    queryFn: async (): Promise<SystemConfig> => {
      return {
        match_threshold: 0.75,
        review_threshold: 0.60,
        detection_threshold: 0.50,
        max_faces_per_image: 50,
        max_upload_size_mb: 10,
        model_pack: 'buffalo_l',
        detector_model: 'SCRFD-10GF',
        embedder_model: 'ResNet50@WebFace600K',
      }
    },
  })
}