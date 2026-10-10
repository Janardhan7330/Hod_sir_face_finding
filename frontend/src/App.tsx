import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { RecognitionPage } from '@/pages/RecognitionPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { OSINTConceptsPage } from '@/pages/OSINTConceptsPage'
import { DatasetUploadPage } from '@/pages/DatasetUploadPage'

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
        <Route index element={<Navigate to="/recognition" replace />} />
        <Route path="dataset-upload" element={<DatasetUploadPage />} />
        <Route path="recognition" element={<RecognitionPage />} />
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