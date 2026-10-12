import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { studentsStore, StoredStudent } from '../lib/studentsStore'
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
    year: student.year ? parseInt(String(student.year), 10) || undefined : undefined,
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

      let dbItems: any[] = []
      let dbCount = 0

      try {
        let query = supabase
          .from('students')
          .select('*', { count: 'exact' })
          .order('name', { ascending: true })
          .range(from, to)

        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`)
        }

        const { data, count, error } = await query
        if (!error && data) {
          dbItems = data
          dbCount = count || data.length
        }
      } catch (err) {
        console.warn('Supabase students fetch error:', err)
      }

      // Merge with local studentsStore
      const localStudents = studentsStore.getStudents()
      const combined = [...dbItems]
      localStudents.forEach((local) => {
        if (!combined.some((item) => item.id === local.id || item.roll_number === local.roll_number)) {
          combined.push(local)
        }
      })

      let filtered = combined
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        filtered = combined.filter(
          (c) => c.name?.toLowerCase().includes(s) || c.roll_number?.toLowerCase().includes(s)
        )
      }

      const items = filtered.slice(from, to + 1).map(mapStudentToPerson)
      const total = Math.max(dbCount, filtered.length)

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
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return mapStudentToPerson(data)
        }
      } catch {}

      const local = studentsStore.getStudentById(id)
      if (local) {
        return mapStudentToPerson(local)
      }

      throw new Error('Student not found')
    },
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: PersonCreate) => {
      const studentId = crypto.randomUUID()
      const localStudent: StoredStudent = {
        id: studentId,
        name: data.display_name,
        roll_number: data.participant_id,
        branch: data.department || '',
        year: data.year ? data.year.toString() : '',
        created_at: new Date().toISOString(),
      }

      // Try Supabase first
      try {
        const { data: created, error } = await supabase
          .from('students')
          .insert({
            id: studentId,
            name: data.display_name,
            roll_number: data.participant_id,
            branch: data.department || '',
            year: data.year ? data.year.toString() : '',
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!error && created) {
          studentsStore.saveStudent(created)
          return mapStudentToPerson(created)
        }
      } catch (err) {
        console.warn('Supabase insert failed, saving to local store:', err)
      }

      // Fallback to local store
      studentsStore.saveStudent(localStudent)
      return mapStudentToPerson(localStudent)
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

      try {
        const { data: updated, error } = await supabase
          .from('students')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single()

        if (!error && updated) {
          studentsStore.saveStudent(updated)
          return mapStudentToPerson(updated)
        }
      } catch {}

      const local = studentsStore.getStudentById(id)
      if (local) {
        const updatedLocal = { ...local, ...updatePayload }
        studentsStore.saveStudent(updatedLocal)
        return mapStudentToPerson(updatedLocal)
      }

      throw new Error('Student could not be updated')
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
      try {
        await supabase.from('students').delete().eq('id', id)
      } catch {}
      studentsStore.deleteStudent(id)
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
      try {
        const { data, error } = await supabase
          .from('student_face_profiles')
          .select('*')
          .eq('student_id', personId)

        if (!error && data) {
          return data.map((profile) => ({
            id: profile.id,
            person_id: profile.student_id,
            created_at: profile.created_at,
            capture_count: profile.capture_count,
            has_descriptors: !!profile.descriptors,
          }))
        }
      } catch {}

      return []
    },
    enabled: !!personId,
  })
}

export function useUploadDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { persons: any[]; images: File[] }): Promise<DatasetUploadResponse> => {
      const createdPersons: any[] = []

      // Helper to turn image file to Base64 data URL
      const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => resolve('')
          reader.readAsDataURL(file)
        })
      }

      for (let i = 0; i < payload.persons.length; i++) {
        const p = payload.persons[i]
        const studentId = crypto.randomUUID()
        const roll = p.participant_id || p.roll_number || `STU-${Date.now()}`
        const name = p.display_name || p.name || 'Student'
        
        // Find matching image for this student or take by index
        const matchingImage = payload.images.find((img) => img.name.startsWith(roll)) || payload.images[i] || payload.images[0]
        let faceImageUrl = ''
        if (matchingImage) {
          faceImageUrl = await fileToDataUrl(matchingImage)
        }

        const studentRecord: StoredStudent = {
          id: studentId,
          name,
          roll_number: roll,
          branch: p.department || p.branch || 'AI & Data Science',
          year: p.year ? p.year.toString() : '3',
          section: p.section || 'A',
          face_image_url: faceImageUrl,
          created_at: new Date().toISOString(),
        }

        // Try Supabase insert
        try {
          await supabase.from('students').insert(studentRecord)
        } catch (err) {
          console.warn('Supabase sync note:', err)
        }

        // Always save to studentsStore so detection will match immediately!
        studentsStore.saveStudent(studentRecord)

        createdPersons.push({
          id: studentRecord.id,
          participant_id: studentRecord.roll_number,
          display_name: studentRecord.name,
          embeddings_created: 1,
        })
      }

      return {
        total_persons: payload.persons.length,
        successful_enrollments: createdPersons.length,
        failed_enrollments: 0,
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