import { useAuth } from '@/hooks/useAuth'
import { usePeople } from '@/hooks/usePeople'
import { useRecognitionHistory } from '@/hooks/useRecognition'
import { useSystemStats } from '@/hooks/useSystem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Search, Shield, ArrowRight, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: peopleData } = usePeople(1, 5)
  const { data: historyData } = useRecognitionHistory(1, 5)
  const { data: statsData } = useSystemStats()

  const stats = [
    {
      title: 'Enrolled People',
      value: statsData?.people_count || peopleData?.total || 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      link: '/people',
    },
    {
      title: 'Face Embeddings',
      value: statsData?.embeddings_count || 0,
      icon: Activity,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      link: '/people',
    },
    {
      title: 'Recognition Events',
      value: statsData?.recognition_events_count || historyData?.total || 0,
      icon: Search,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      link: '/history',
    },
    {
      title: 'Consent Granted',
      value: statsData?.consent_granted_count || 0,
      icon: Shield,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      link: '/people',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Link to={stat.link} className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-2">
                View details <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Recognition Events</CardTitle>
          </CardHeader>
          <CardContent>
            {historyData?.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recognition events yet</p>
            ) : (
              <div className="space-y-3">
                {historyData?.items.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    to={`/history/${event.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.faces_detected} faces detected</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.faces_matched > 0 && (
                        <Badge variant="success">{event.faces_matched} matched</Badge>
                      )}
                      {event.faces_review > 0 && (
                        <Badge variant="warning">{event.faces_review} review</Badge>
                      )}
                      {event.faces_unknown > 0 && (
                        <Badge variant="secondary">{event.faces_unknown} unknown</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/history" className="text-sm text-primary hover:underline">
                View all history →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/enrollment"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Enroll New Person</p>
                <p className="text-sm text-muted-foreground">Add authorized participants</p>
              </div>
            </Link>
            <Link
              to="/recognition"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-500/10">
                <Search className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Recognize Faces</p>
                <p className="text-sm text-muted-foreground">Upload group photo to analyze</p>
              </div>
            </Link>
            <Link
              to="/people"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Manage People</p>
                <p className="text-sm text-muted-foreground">View and edit enrolled participants</p>
              </div>
            </Link>
            <Link
              to="/dataset-upload"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Upload className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Bulk Dataset Upload</p>
                <p className="text-sm text-muted-foreground">Upload multiple persons with images</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}