import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { usePeople } from '@/hooks/usePeople'
import { useEnroll, useValidateImage } from '@/hooks/useEnrollment'
import { cn } from '@/utils/cn'

const personSchema = z.object({
  participant_id: z.string().min(1, 'Participant ID is required'),
  display_name: z.string().min(1, 'Display name is required'),
  college_id: z.string().optional(),
  department: z.string().optional(),
  year: z.coerce.number().min(1).max(10).optional(),
})

type PersonForm = z.infer<typeof personSchema>

export function EnrollmentPage() {
  const { data: peopleData } = usePeople(1, 100)
  const enrollMutation = useEnroll()
  const validateMutation = useValidateImage()
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; message: string }>>({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      participant_id: '',
      display_name: '',
      college_id: '',
      department: '',
      year: undefined,
    },
  })

  const watchedPersonId = watch('participant_id')

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((f) => f.type.startsWith('image/'))
    setPreviewImages((prev) => [...prev, ...validFiles].slice(0, 5))
    validFiles.forEach((file) => {
      validateMutation.mutate(file, {
        onSuccess: (result) => {
          setValidationResults((prev) => ({
            ...prev,
            [file.name]: { valid: result.valid, message: result.message },
          })
          )
        },
      })
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  })

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (_data: PersonForm) => {
    if (previewImages.length === 0) {
      alert('Please add at least one enrollment image')
      return
    }

    const personId = watchedPersonId || selectedPersonId
    if (!personId) {
      alert('Please select or create a person')
      return
    }

    try {
      await enrollMutation.mutateAsync({
        personId,
        files: previewImages,
        consentConfirmed: true,
      })
      alert('Enrollment successful!')
      setPreviewImages([])
      setValidationResults({})
      setSelectedPersonId('')
      setValue('participant_id', '')
      setValue('display_name', '')
      setValue('college_id', '')
      setValue('department', '')
      setValue('year', undefined)
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Enrollment failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollment</h1>
          <p className="text-muted-foreground">Enroll authorized participants with consent</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="participant_id">Participant ID</Label>
                <Input
                  id="participant_id"
                  placeholder="e.g., STU-2024-001"
                  {...register('participant_id')}
                  list="people-list"
                />
                <datalist id="people-list">
                  {peopleData?.items.map((p) => (
                    <option key={p.id} value={p.participant_id}>
                      {p.display_name} ({p.participant_id})
                    </option>
                  ))}
                </datalist>
                {errors.participant_id && (
                  <p className="text-sm text-destructive">{errors.participant_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input id="display_name" placeholder="John Doe" {...register('display_name')} />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
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
                {errors.year && (
                  <p className="text-sm text-destructive">{errors.year.message}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Up to 5 images (JPG, PNG, WebP) • Max 10MB each
              </p>
            </div>

            {previewImages.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">Selected Images ({previewImages.length}/5)</p>
                <div className="flex flex-wrap gap-3">
                  {previewImages.map((file, index) => {
                    const validation = validationResults[file.name]
                    return (
                      <div key={index} className="relative group">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {validation && (
                          <Badge
                            className="absolute bottom-2 left-2"
                            variant={validation.valid ? 'success' : 'destructive'}
                          >
                            {validation.valid ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button type="submit" className="w-full" disabled={enrollMutation.isPending || previewImages.length === 0}>
                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Participant'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}