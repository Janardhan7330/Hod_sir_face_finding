import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  get<T>(url: string, params?: object) {
    return this.client.get<T>(url, { params })
  }

  post<T>(url: string, data?: object, config?: object) {
    return this.client.post<T>(url, data, config)
  }

  patch<T>(url: string, data?: object) {
    return this.client.patch<T>(url, data)
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url)
  }

  postForm<T>(url: string, formData: FormData) {
    return this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }
}

export const apiClient = new ApiClient()