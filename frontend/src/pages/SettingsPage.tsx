import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Database, Cpu, Eye } from 'lucide-react'
import { useSystemConfig, useSystemStats } from '@/hooks/useSystem'
import { useAuth } from '@/hooks/useAuth'

export function SettingsPage() {
  const { user } = useAuth()
  const { data: config } = useSystemConfig()
  const { data: stats } = useSystemStats()
  const [activeTab, setActiveTab] = useState<'general' | 'thresholds' | 'model' | 'account'>('general')

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Shield },
    { id: 'thresholds' as const, label: 'Thresholds', icon: Cpu },
    { id: 'model' as const, label: 'Model', icon: Database },
    { id: 'account' as const, label: 'Account', icon: Eye },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and account settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-0">
            <nav className="flex flex-col">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 rounded-none border-0"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="pt-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">System Information</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Environment</p>
                      <p className="font-medium capitalize">{import.meta.env.MODE || 'development'}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">API Version</p>
                      <p className="font-medium">v1</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total People</p>
                      <p className="font-medium">{stats?.people_count || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Embeddings</p>
                      <p className="font-medium">{stats?.embeddings_count || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Recognition Events</p>
                      <p className="font-medium">{stats?.recognition_events_count || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Consent Granted</p>
                      <p className="font-medium">{stats?.consent_granted_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline">
                      <Shield className="mr-2 h-4 w-4" />
                      View Audit Logs
                    </Button>
                    <Button variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button variant="outline">
                      <Cpu className="mr-2 h-4 w-4" />
                      Run Benchmark
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'thresholds' && config && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Matching Thresholds</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust similarity thresholds for face matching. Higher values = stricter matching.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">Match Threshold</p>
                          <p className="text-sm text-muted-foreground">Above this = Matched</p>
                        </div>
                        <Badge variant="success">{config.match_threshold}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.5"
                          max="0.95"
                          step="0.01"
                          value={config.match_threshold}
                          className="flex-1"
                          disabled
                        />
                        <span className="text-sm text-muted-foreground w-10 text-right">
                          {(config.match_threshold * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">Review Threshold</p>
                          <p className="text-sm text-muted-foreground">Above this = Review (below Match)</p>
                        </div>
                        <Badge variant="warning">{config.review_threshold}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.3"
                          max="0.9"
                          step="0.01"
                          value={config.review_threshold}
                          className="flex-1"
                          disabled
                        />
                        <span className="text-sm text-muted-foreground w-10 text-right">
                          {(config.review_threshold * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">Detection Threshold</p>
                          <p className="text-sm text-muted-foreground">Minimum confidence for face detection</p>
                        </div>
                        <Badge variant="default">{config.detection_threshold}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.01"
                          value={config.detection_threshold}
                          className="flex-1"
                          disabled
                        />
                        <span className="text-sm text-muted-foreground w-10 text-right">
                          {(config.detection_threshold * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Note: Threshold changes require backend configuration update and restart.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'model' && config && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Model Configuration</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Model Pack</p>
                      <p className="font-medium">{config.model_pack}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Detector</p>
                      <p className="font-medium">{config.detector_model}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Embedder</p>
                      <p className="font-medium">{config.embedder_model}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Max Faces/Image</p>
                      <p className="font-medium">{config.max_faces_per_image}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Max Upload Size</p>
                      <p className="font-medium">{config.max_upload_size_mb} MB</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="text-lg font-semibold mb-4">Model Information</h2>
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-medium mb-2">InsightFace buffalo_l</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Detection: SCRFD-10GF (RetinaFace-based)</li>
                      <li>• Recognition: ResNet50 @ WebFace600K (ArcFace)</li>
                      <li>• Alignment: 2D 106-point landmarks</li>
                      <li>• Model Size: ~326 MB</li>
                      <li>• License: Non-commercial research only</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user?.email}</p>
                        <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                        <p className="text-xs text-muted-foreground">
                          Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="text-lg font-semibold mb-4">Security</h2>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="mr-2 h-4 w-4" />
                      Manage Sessions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="mr-2 h-4 w-4" />
                      Download My Data
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="text-lg font-semibold mb-4">Preferences</h2>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates</p>
                      </div>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}