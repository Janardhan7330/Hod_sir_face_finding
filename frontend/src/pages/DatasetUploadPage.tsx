import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Plus, Minus, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { useUploadDataset } from '@/hooks/usePeople'
import { cn } from '@/utils/cn'
import { DatasetUploadResponse } from '@/types/domain'

const personSchema = z.object({
  participant_id: z.string().min(1, 'Participant ID is required'),
  display_name: z.string().min(1, 'Display name is required'),
  college_id: z.string().optional(),
  department: z.string().optional(),
  year: z.coerce.number().min(1).max(10).optional(),
  consent_confirmed: z.boolean().default(true),
})

const datasetSchema = z.object({
  persons: z.array(personSchema).min(1, 'At least one person is required').max(50, 'Maximum 50 persons allowed'),
})

type DatasetForm = z.infer<typeof datasetSchema>

export function DatasetUploadPage() {
  const uploadMutation = useUploadDataset()
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<DatasetUploadResponse | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DatasetForm>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      persons: [
        { participant_id: '', display_name: '', college_id: '', department: '', year: undefined, consent_confirmed: true },
      ],
    },
  })

  const watchedPersons = watch('persons')

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((f) => f.type.startsWith('image/'))
    setPreviewImages((prev) => [...prev, ...validFiles].slice(0, 50))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 50,
    maxSize: 10 * 1024 * 1024,
  })

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addPerson = () => {
    setValue('persons', [...watchedPersons, { participant_id: '', display_name: '', college_id: '', department: '', year: undefined, consent_confirmed: true }])
  }

  const removePerson = (index: number) => {
    if (watchedPersons.length <= 1) return
    setValue('persons', watchedPersons.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: DatasetForm) => {
    if (previewImages.length === 0) {
      alert('Please add at least one image')
      return
    }

    try {
      const response = await uploadMutation.mutateAsync({ persons: data.persons, images: previewImages })
      setResult(response)
      setSubmitted(true)
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Upload failed')
    }
  }

  const downloadTemplate = () => {
    const template = {
      persons: [
        { participant_id: 'STU-2024-001', display_name: 'John Doe', college_id: 'STU123', department: 'Computer Science', year: 2, consent_confirmed: true },
        { participant_id: 'STU-2024-002', display_name: 'Jane Smith', college_id: 'STU456', department: 'Mathematics', year: 3, consent_confirmed: true },
      ],
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dataset-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dataset Upload</h1>
          <p className="text-muted-foreground">Upload a dataset of persons with their images and details for bulk enrollment</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Persons in Dataset</CardTitle>
            <CardDescription>Add persons with their details. Each person should have at least one corresponding image.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchedPersons.map((_person, index) => (
                <Card key={index} className="border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Person {index + 1}</CardTitle>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePerson(index)} disabled={watchedPersons.length <= 1}>
                        <Minus className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`persons.${index}.participant_id`}>Participant ID</Label>
                        <Input
                          id={`persons.${index}.participant_id`}
                          placeholder="STU-2024-001"
                          {...register(`persons.${index}.participant_id`)}
                        />
                        {errors.persons?.[index]?.participant_id && (
                          <p className="text-sm text-destructive">{errors.persons[index].participant_id.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`persons.${index}.display_name`}>Display Name</Label>
                        <Input id={`persons.${index}.display_name`} placeholder="John Doe" {...register(`persons.${index}.display_name`)} />
                        {errors.persons?.[index]?.display_name && (
                          <p className="text-sm text-destructive">{errors.persons[index].display_name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`persons.${index}.college_id`}>College ID (Optional)</Label>
                        <Input id={`persons.${index}.college_id`} placeholder="STU123" {...register(`persons.${index}.college_id`)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`persons.${index}.department`}>Department (Optional)</Label>
                        <Input id={`persons.${index}.department`} placeholder="Computer Science" {...register(`persons.${index}.department`)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`persons.${index}.year`}>Year (Optional)</Label>
                        <Input id={`persons.${index}.year`} type="number" min="1" max="10" placeholder="2" {...register(`persons.${index}.year`)} />
                        {errors.persons?.[index]?.year && (
                          <p className="text-sm text-destructive">{errors.persons[index].year.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`persons.${index}.consent_confirmed`}
                            {...register(`persons.${index}.consent_confirmed`)}
                            checked={watchedPersons[index]?.consent_confirmed !== false}
                          />
                          <Label htmlFor={`persons.${index}.consent_confirmed`}>Consent confirmed</Label>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium">Image Matching:</p>
                      <p className="text-muted-foreground">
                        Upload images with filenames starting with the participant ID (e.g., "STU-2024-001_1.jpg", "STU-2024-001_2.jpg")
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addPerson} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Person
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
            <CardDescription>Upload images for all persons. Match filenames to participant IDs (e.g., STU-2024-001_1.jpg)</CardDescription>
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
                {isDragActive ? 'Drop images here...' : 'Drag & drop images here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Max 10MB each • Up to 50 images</p>
            </div>

            {previewImages.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Selected Images ({previewImages.length}/50)</p>
                  <Badge variant="secondary">{previewImages.length} images</Badge>
                </div>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {previewImages.map((file, index) => (
                    <div key={index} className="relative group w-20 h-20">
                      <div className="w-full h-full rounded-lg overflow-hidden border bg-muted">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button type="submit" className="w-full sm:w-auto" disabled={uploadMutation.isPending || previewImages.length === 0 || watchedPersons.length === 0}>
                {uploadMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Uploading Dataset...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Dataset
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {submitted && result && (
        <Card className={cn('border-green-500', result.failed_enrollments > 0 && 'border-yellow-500')}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Upload Complete</CardTitle>
            </div>
            <CardDescription>
              {result.successful_enrollments} of {result.total_persons} persons enrolled successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">Successful</p>
                <p className="text-2xl font-bold text-green-600">{result.successful_enrollments}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.failed_enrollments}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-700">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{result.warnings.length}</p>
              </div>
            </div>

            {result.created_persons.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Enrolled Persons</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.created_persons.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                      <div>
                        <p className="font-medium">{p.display_name} ({p.participant_id})</p>
                        <p className="text-sm text-muted-foreground">{p.embeddings_created} embeddings created</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-yellow-700">Warnings</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="p-2 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => { setSubmitted(false); setResult(null); }}>
              Upload Another Dataset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}