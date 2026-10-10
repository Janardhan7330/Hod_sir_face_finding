// API Configuration
// Use environment variable if available, otherwise fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

// Export for use in API client
export const config = {
  apiUrl: API_BASE_URL,
  timeout: 30000,
};
