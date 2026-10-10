import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight, Calendar, Clock, Eye, X, CheckCircle2, UserX } from 'lucide-react'
import { useRecognitionHistory, useRecognitionDetail } from '@/hooks/useRecognition'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import type { FaceResult } from '@/types/domain'

const columns = [
  { key: 'created_at', header: 'Date & Time' },
  { key: 'matched_names', header: 'Detected Student(s)' },
  { key: 'faces_detected', header: 'Faces' },
  { key: 'faces_matched', header: 'Matched' },
  { key: 'faces_unknown', header: 'Unknown' },
  { key: 'processing_time_ms', header: 'Latency' },
  { key: 'actions', header: '' },
]

export function HistoryPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState('')

  const { data, isLoading } = useRecognitionHistory(page, pageSize)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const { data: detailData, isLoading: isDetailLoading } = useRecognitionDetail(selectedEvent || '')

  const handleView = (eventId: string) => {
    setSelectedEvent(eventId)
  }

  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Recognition History</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              Supabase Enrolled
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Review past face recognition scans, detected students, and profile verification records</p>
        </div>
      </div>

      {/* Selected Event Details Card */}
      {selectedEvent && (
        <Card className="border-2 border-primary/40 shadow-lg animate-in fade-in-50 duration-200">
          <CardHeader className="bg-muted/40 border-b flex flex-row items-center justify-between py-3 px-5">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Detection & Profile Verification Details
              </CardTitle>
              {detailData && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scan recorded on {format(new Date(detailData.created_at), 'MMM d, yyyy h:mm:ss a')} • Latency: {detailData.processing_time_ms}ms
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {isDetailLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : detailData ? (
              <div className="space-y-5">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border bg-background">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Total Faces</p>
                    <p className="text-2xl font-bold mt-0.5">{detailData.faces_detected}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <p className="text-xs text-emerald-800 uppercase font-semibold">Matched</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-0.5">{detailData.faces_matched}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                    <p className="text-xs text-amber-800 uppercase font-semibold">Review</p>
                    <p className="text-2xl font-bold text-amber-700 mt-0.5">{detailData.faces_review}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/40">
                    <p className="text-xs text-rose-800 uppercase font-semibold">Unknown</p>
                    <p className="text-2xl font-bold text-rose-700 mt-0.5">{detailData.faces_unknown}</p>
                  </div>
                </div>

                {/* Detected People / Students List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Identified Student Profiles ({detailData.results.length})
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {detailData.results.map((face: FaceResult) => {
                      const isMatched = face.status === 'matched'
                      const isReview = face.status === 'review'
                      const person = face.person

                      if (isMatched && person) {
                        return (
                          <div
                            key={face.face_id}
                            className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 transition-all"
                          >
                            {person.photo_url ? (
                              <div className="relative flex-shrink-0">
                                <img
                                  src={person.photo_url}
                                  alt={person.display_name}
                                  className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                                />
                                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                                  DB
                                </span>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-2xl flex-shrink-0">
                                {person.display_name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                                  VERIFIED STUDENT
                                </Badge>
                                <span className="text-xs font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                                  {(face.similarity * 100).toFixed(1)}% Match
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-emerald-950 truncate">
                                {person.display_name}
                              </h3>
                              <p className="text-xs font-mono font-bold text-emerald-800">
                                Roll No: {person.participant_id}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Department</span>
                                  <span className="font-bold text-emerald-950">{person.department || 'AI'}</span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Year & Sem</span>
                                  <span className="font-bold text-emerald-950">
                                    {person.year ? `Year ${person.year}` : 'Year 3'}
                                    {person.semester ? ` • Sem ${person.semester}` : ''}
                                  </span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Section</span>
                                  <span className="font-bold text-emerald-950">{person.section ? `Section ${person.section}` : 'General'}</span>
                                </div>
                                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Source Database</span>
                                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Supabase
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={face.face_id}
                          className={cn(
                            'p-4 rounded-xl border flex items-center gap-4',
                            isReview ? 'border-amber-200 bg-amber-50/40' : 'border-rose-200 bg-rose-50/40'
                          )}
                        >
                          <div className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center font-bold flex-shrink-0 border',
                            isReview ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-rose-100 border-rose-200 text-rose-600'
                          )}>
                            <UserX className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isReview ? 'warning' : 'secondary'} className={isReview ? 'bg-amber-500 text-white font-bold text-xs' : 'bg-rose-100 text-rose-800 font-bold text-xs'}>
                                {isReview ? 'REVIEW REQUIRED' : 'UNREGISTERED INDIVIDUAL'}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">Face #{face.face_id}</span>
                            </div>
                            <p className="text-sm font-semibold mt-1">
                              {isReview ? 'Similarity near decision boundary' : 'No matching student record found in authorized database'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Similarity score: {(face.similarity * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Main History Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Recognition Scans</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search history..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data?.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recognition events found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="w-fit">
                          {col.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((event) => (
                      <TableRow
                        key={event.id}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedEvent === event.id ? 'bg-muted/80 ring-1 ring-primary/40' : 'hover:bg-accent/60'
                        )}
                        onClick={() => handleView(event.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-xs">
                              {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                        </TableCell>

                        {/* Detected Student Badges */}
                        <TableCell>
                          {event.matched_names && event.matched_names.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {event.matched_names.map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Unregistered Face
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{event.faces_detected}</span>
                            <span className="text-muted-foreground text-xs">face(s)</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={event.faces_matched > 0 ? 'success' : 'outline'} className={event.faces_matched > 0 ? 'bg-emerald-600 text-white' : ''}>
                            {event.faces_matched} matched
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">{event.faces_unknown}</span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{event.processing_time_ms}ms</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleView(event.id) }}
                            className="text-primary hover:text-primary font-semibold flex items-center gap-1.5 text-xs"
                          >
                            <Eye className="h-4 w-4" />
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.total || 0)} of {data?.total} results
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}