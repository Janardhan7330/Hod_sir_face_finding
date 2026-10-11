import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Person, PersonCreate, PersonUpdate, ConsentUpdate, DatasetUploadResponse } from '../types/domain'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

function mapStudentToPerson(student: any): Person {
  return {
    id: student.id,
    participant_id: student.roll_number || student.id,
    display_name: student.name || 'Unnamed Student',
    college_id: student.uid || student.roll_number,
    department: student.branch || student.department || '',
    year: student.year ? parseInt(student.year, 10) || undefined : undefined,
    consent_status: 'granted',
    consent_date: student.created_at,
    notes: student.section ? `Section: ${student.section}` : undefined,
    photo_url: student.face_image_url || undefined,
    section: student.section,
    semester: student.semester,
    created_at: student.created_at,
    updated_at: student.created_at,
    embeddings_count: student.face_descriptor ? 1 : 0,
  }
}

export function usePeople(page = 1, pageSize = 20, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['people', page, pageSize, filters],
    queryFn: async (): Promise<PaginatedResponse<Person>> => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('students')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`)
      }

      const { data, count, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      const items = (data || []).map(mapStudentToPerson)
      const total = count || items.length

      return {
        items,
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize) || 1,
      }
    },
  })
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: async (): Promise<Person> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return mapStudentToPerson(data)
    },
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: PersonCreate) => {
      const { data: created, error } = await supabase
        .from('students')
        .insert({
          name: data.display_name,
          roll_number: data.participant_id,
          branch: data.department || '',
          year: data.year ? data.year.toString() : '',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return mapStudentToPerson(created)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'stats'] })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PersonUpdate }) => {
      const updatePayload: Record<string, any> = {}
      if (data.display_name) updatePayload.name = data.display_name
      if (data.department) updatePayload.branch = data.department
      if (data.year) updatePayload.year = data.year.toString()

      const { data: updated, error } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return mapStudentToPerson(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'stats'] })
    },
  })
}

export function useUpdateConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConsentUpdate }) => {
      // In Supabase schema, consent is implicit in students registration
      return { id, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export function usePersonEmbeddings(personId: string) {
  return useQuery({
    queryKey: ['person', personId, 'embeddings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_face_profiles')
        .select('*')
        .eq('student_id', personId)

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map((profile) => ({
        id: profile.id,
        person_id: profile.student_id,
        created_at: profile.created_at,
        capture_count: profile.capture_count,
        has_descriptors: !!profile.descriptors,
      }))
    },
    enabled: !!personId,
  })
}

export function useUploadDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { persons: any[]; images: File[] }): Promise<DatasetUploadResponse> => {
      const createdPersons: any[] = []
      let failed = 0

      for (const p of payload.persons) {
        try {
          const { data, error } = await supabase
            .from('students')
            .insert({
              name: p.display_name || p.name,
              roll_number: p.participant_id || p.roll_number,
              branch: p.department || '',
              year: p.year ? p.year.toString() : '',
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (!error && data) {
            createdPersons.push({
              id: data.id,
              participant_id: data.roll_number,
              display_name: data.name,
              embeddings_created: 0,
            })
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }

      return {
        total_persons: payload.persons.length,
        successful_enrollments: createdPersons.length,
        failed_enrollments: failed,
        warnings: [],
        created_persons: createdPersons,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'stats'] })
    },
  })
}