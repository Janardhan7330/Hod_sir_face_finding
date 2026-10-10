export interface Person {
  id: string
  participant_id: string
  display_name: string
  college_id?: string
  department?: string
  year?: number
  consent_status: 'pending' | 'granted' | 'withdrawn'
  consent_date?: string
  notes?: string
  photo_url?: string
  section?: string
  semester?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  embeddings_count: number
}

export interface PersonDetail {
  id: string
  participant_id: string
  display_name: string
  college_id?: string
  department?: string
  year?: number
  consent_status: 'pending' | 'granted' | 'withdrawn'
  consent_date?: string
  notes?: string
  photo_url?: string
  section?: string
  semester?: string
  created_at: string
  updated_at: string
  embeddings_count: number
}

export interface PersonCreate {
  participant_id: string
  display_name: string
  college_id?: string
  department?: string
  year?: number
  consent_confirmed: boolean
}

export interface DatasetPersonCreate {
  participant_id: string
  display_name: string
  college_id?: string
  department?: string
  year?: number
  consent_confirmed: boolean
}

export interface DatasetUploadRequest {
  persons: DatasetPersonCreate[]
}

export interface DatasetUploadResponse {
  total_persons: number
  successful_enrollments: number
  failed_enrollments: number
  warnings: string[]
  created_persons: Array<{
    id: string
    participant_id: string
    display_name: string
    embeddings_created: number
  }>
}

export interface PersonUpdate {
  display_name?: string
  college_id?: string
  department?: string
  year?: number
  notes?: string
}

export interface ConsentUpdate {
  consent_status: 'granted' | 'withdrawn'
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PersonSummary {
  id: string
  display_name: string
  department?: string
  year?: number
}

export interface FaceResult {
  face_id: number
  bbox: BoundingBox
  status: 'matched' | 'review' | 'unknown'
  person: PersonDetail | null
  similarity: number
}

export interface RecognitionResponse {
  event_id: string
  processing_time_ms: number
  image_width: number
  image_height: number
  faces_detected: number
  faces_matched: number
  faces_unknown: number
  faces_review: number
  results: FaceResult[]
}

export interface RecognitionDetailResponse {
  event_id: string
  image_hash: string
  image_width: number
  image_height: number
  faces_detected: number
  faces_matched: number
  faces_unknown: number
  faces_review: number
  processing_time_ms: number
  created_at: string
  results: FaceResult[]
}

export interface RecognitionEventSummary {
  id: string
  image_hash: string
  faces_detected: number
  faces_matched: number
  faces_unknown: number
  faces_review: number
  processing_time_ms: number
  created_at: string
  matched_names?: string[]
}

export interface EnrollmentResponse {
  embeddings_created: number
  warnings: string[]
  person_id: string
}

export interface ValidateImageResponse {
  valid: boolean
  faces_detected: number
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

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