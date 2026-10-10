import { Shield, UserCheck, Database, Lock, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy & Consent</h1>
        <p className="text-muted-foreground">How we protect your biometric data and ensure consent-based recognition</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Core Privacy Principles</CardTitle>
            </div>
            <CardDescription>Our system is built on privacy-by-design principles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Explicit Consent Required</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No person is enrolled or recognized without explicit, documented consent.
                    Consent can be withdrawn at any time, triggering immediate data deletion.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Lock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Biometric Data Protection</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Face embeddings are encrypted at rest, access-controlled, and audit-logged.
                    Raw enrollment images are not stored by default.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Database className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Minimal Data Collection</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    We collect only what's necessary: participant ID, display name, and face embeddings.
                    No sensitive attributes (race, religion, health, etc.) are inferred or stored.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Right to Deletion</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Participants can request complete data deletion at any time.
                    Recognition history can be purged independently of enrollment data.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle>Data Security Measures</CardTitle>
            </div>
            <CardDescription>Technical safeguards protecting biometric data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Lock, title: 'Encryption at Rest', desc: 'Face embeddings encrypted using AES-256 before database storage' },
                { icon: Shield, title: 'Access Control', desc: 'Role-based access (Admin/Operator) with audit logging on all data access' },
                { icon: Database, title: 'Secure Database', desc: 'PostgreSQL with pgvector, parameterized queries, row-level security policies' },
                { icon: Clock, title: 'Auto Cleanup', desc: 'Temporary upload files automatically deleted after 1 hour' },
                { icon: AlertCircle, title: 'Audit Trail', desc: 'Immutable audit logs for all enrollment, recognition, and deletion events' },
                { icon: CheckCircle, title: 'TLS in Transit', desc: 'All API communication encrypted via TLS 1.3' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Important Limitations</CardTitle>
            </div>
            <CardDescription>Please understand the scope and limitations of this system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li><strong>Academic demonstration only</strong> — Not for production security or surveillance use</li>
              <li><strong>Consent-based recognition</strong> — Only recognizes explicitly enrolled, consenting individuals</li>
              <li><strong>No internet searches</strong> — Does not perform reverse face search on social media or search engines</li>
              <li><strong>No attribute inference</strong> — Does not infer race, religion, health, sexuality, or political affiliation</li>
              <li><strong>Threshold-dependent</strong> — Similarity scores are not probabilities; require calibration for production use</li>
              <li><strong>Demographic bias</strong> — Accuracy varies across demographics (see model documentation)</li>
              <li><strong>Static images only</strong> — No liveness detection or video stream processing</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention Policy</CardTitle>
            <CardDescription>How long we keep different types of data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'Enrollment Data', retention: 'Until consent withdrawn or deletion requested', icon: UserCheck },
                { type: 'Face Embeddings', retention: 'Until person deleted or consent withdrawn', icon: Database },
                { type: 'Recognition Events', retention: 'Configurable (default: 90 days)', icon: Clock },
                { type: 'Audit Logs', retention: '1 year (configurable)', icon: Shield },
                { type: 'Temporary Uploads', retention: '1 hour (automatic cleanup)', icon: Trash2 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <Badge variant="secondary">{item.retention}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}