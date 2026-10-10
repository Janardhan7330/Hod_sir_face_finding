import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { EnrollmentResponse, ValidateImageResponse } from '../types/domain'

export function useEnroll() {
  return useMutation({
    mutationFn: async ({
      personId,
      files,
      consentConfirmed,
    }: {
      personId: string
      files: File[]
      consentConfirmed: boolean
    }): Promise<EnrollmentResponse> => {
      const formData = new FormData()
      formData.append('person_id', personId)
      formData.append('consent_confirmed', consentConfirmed.toString())
      files.forEach((file) => formData.append('images', file))

      const response = await apiClient.postForm<EnrollmentResponse>('/enrollment', formData)
      return response.data
    },
  })
}

export function useValidateImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<ValidateImageResponse> => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await apiClient.postForm<ValidateImageResponse>('/enrollment/validate', formData)
      return response.data
    },
  })
}