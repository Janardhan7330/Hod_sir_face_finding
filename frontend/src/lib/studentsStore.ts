// Universal Store for Student Data with IndexedDB & LocalStorage backup
// Ensures face recognition works reliably even when Supabase RLS restricts anon inserts

export interface StoredStudent {
  id: string
  name: string
  roll_number: string
  branch?: string
  department?: string
  year?: string | number
  section?: string
  semester?: string
  face_image_url?: string
  face_descriptor?: number[]
  created_at: string
}

const LOCAL_STORAGE_KEY = 'face_lab_registered_students'

export const studentsStore = {
  getStudents(): StoredStudent[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (!data) return []
      return JSON.parse(data)
    } catch {
      return []
    }
  },

  saveStudent(student: StoredStudent): void {
    const list = this.getStudents()
    const index = list.findIndex((s) => s.id === student.id || s.roll_number === student.roll_number)
    if (index >= 0) {
      list[index] = { ...list[index], ...student }
    } else {
      list.unshift(student)
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
      console.warn('LocalStorage save error:', e)
    }
  },

  saveStudents(students: StoredStudent[]): void {
    students.forEach((s) => this.saveStudent(s))
  },

  deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id && s.roll_number !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  },

  getStudentById(id: string): StoredStudent | undefined {
    return this.getStudents().find((s) => s.id === id || s.roll_number === id)
  },
}
