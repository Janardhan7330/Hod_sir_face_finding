import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, User, Shield, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePeople, useCreatePerson, useUpdatePerson, useDeletePerson, useUpdateConsent } from '@/hooks/usePeople'

const personSchema = z.object({
  participant_id: z.string().min(1, 'Participant ID is required'),
  display_name: z.string().min(1, 'Display name is required'),
  college_id: z.string().optional(),
  department: z.string().optional(),
  year: z.coerce.number().min(1).max(10).optional(),
  consent_confirmed: z.boolean().default(false),
})

type PersonForm = z.infer<typeof personSchema>

export function PeoplePage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPerson, setEditingPerson] = useState<any>(null)

  const { data, isLoading, refetch: refreshPeople } = usePeople(page, pageSize, { search })
  const createMutation = useCreatePerson()
  const updateMutation = useUpdatePerson()
  const deleteMutation = useDeletePerson()
  const consentMutation = useUpdateConsent()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
  })

  const handleEdit = (person: any) => {
    setEditingPerson(person)
    setValue('participant_id', person.participant_id)
    setValue('display_name', person.display_name)
    setValue('college_id', person.college_id || '')
    setValue('department', person.department || '')
    setValue('year', person.year)
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingPerson(null)
    setShowForm(false)
    reset()
  }

  const onSubmit = async (data: PersonForm) => {
    try {
      if (editingPerson) {
        await updateMutation.mutateAsync({ id: editingPerson.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleCancel()
      refreshPeople()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this person? This will also delete all their face embeddings.')) {
      try {
        await deleteMutation.mutateAsync(id)
        refreshPeople()
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Delete failed')
      }
    }
  }

  const handleConsentToggle = async (person: any) => {
    try {
      await consentMutation.mutateAsync({
        id: person.id,
        data: { consent_status: person.consent_status === 'granted' ? 'withdrawn' : 'granted' },
      })
      refreshPeople()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Consent update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrolled People</h1>
          <p className="text-muted-foreground">Manage authorized participants and their consent status</p>
        </div>
        <Button onClick={() => { setEditingPerson(null); setShowForm(true); reset(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingPerson ? 'Edit Person' : 'Add New Person'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="participant_id">Participant ID</Label>
                  <Input
                    id="participant_id"
                    placeholder="STU-2024-001"
                    {...register('participant_id')}
                    disabled={!!editingPerson}
                  />
                  {errors.participant_id && <p className="text-sm text-destructive">{errors.participant_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input id="display_name" placeholder="John Doe" {...register('display_name')} />
                  {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college_id">College ID (Optional)</Label>
                  <Input id="college_id" placeholder="Student/Employee ID" {...register('college_id')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input id="department" placeholder="Computer Science" {...register('department')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year (Optional)</Label>
                  <Input id="year" type="number" min="1" max="10" placeholder="1" {...register('year')} />
                  {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="consent_confirmed"
                      {...register('consent_confirmed')}
                    />
                    <Label htmlFor="consent_confirmed">Consent confirmed</Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPerson ? 'Save Changes' : 'Create Person'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>People ({data?.total || 0})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search people..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No people enrolled yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Person
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Embeddings</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((person: any) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-mono text-sm">{person.participant_id}</TableCell>
                        <TableCell className="font-medium">{person.display_name}</TableCell>
                        <TableCell>{person.department || '—'}</TableCell>
                        <TableCell>{person.year ? `Year ${person.year}` : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            person.consent_status === 'granted' ? 'success' :
                            person.consent_status === 'withdrawn' ? 'destructive' : 'warning'
                          } className="capitalize">
                            {person.consent_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{person.embeddings_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(person)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleConsentToggle(person)}>
                              {person.consent_status === 'granted' ? (
                                <Shield className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(person.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.total || 0)} of {data?.total} people
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min((data?.total_pages || 1), p + 1))} disabled={page === (data?.total_pages || 1)}>
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