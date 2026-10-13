import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { RecognitionPage } from '@/pages/RecognitionPage'
import { DatasetUploadPage } from '@/pages/DatasetUploadPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { OSINTConceptsPage } from '@/pages/OSINTConceptsPage'

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4">
        <Outlet />
      </main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Default route lands on Live Recognition */}
        <Route index element={<Navigate to="/recognition" replace />} />
        <Route path="recognition" element={<RecognitionPage />} />
        <Route path="dataset-upload" element={<DatasetUploadPage />} />

        {/* Redirect removed routes so user always lands on Live Recognition */}
        <Route path="dashboard" element={<Navigate to="/recognition" replace />} />
        <Route path="enrollment" element={<Navigate to="/recognition" replace />} />
        <Route path="history" element={<Navigate to="/recognition" replace />} />
        <Route path="people" element={<Navigate to="/recognition" replace />} />

        {/* Optional utility pages */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="osint-concepts" element={<OSINTConceptsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/recognition" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}