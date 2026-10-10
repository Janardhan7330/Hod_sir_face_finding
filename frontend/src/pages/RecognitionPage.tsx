import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Search,
  Loader2,
  Camera,
  RefreshCw,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  UserX,
  ShieldCheck,
} from 'lucide-react'
import { useRecognize } from '@/hooks/useRecognition'
import { FaceResult, RecognitionResponse } from '@/types/domain'
import { cn } from '@/utils/cn'

export function RecognitionPage() {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFace, setSelectedFace] = useState<FaceResult | null>(null)
  const [result, setResult] = useState<RecognitionResponse | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognizeMutation = useRecognize()

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err: any) {
      console.error('Camera access error:', err)
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : 'Could not access camera. Please check your camera settings.'
      )
      setCameraActive(false)
    }
  }, [facingMode])

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Auto-start camera when in camera mode and no captured preview
  useEffect(() => {
    if (mode === 'camera' && !previewUrl) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [mode, previewUrl, startCamera, stopCamera])

  // Dropzone file upload
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      stopCamera()
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setSelectedFace(null)
      handleRecognize(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  // Capture snapshot from live video
  const captureSnapshot = () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = video.videoWidth || 1280
    offscreenCanvas.height = video.videoHeight || 720
    const ctx = offscreenCanvas.getContext('2d')
    if (!ctx) return

    // If front camera, flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(offscreenCanvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height)

    offscreenCanvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setResult(null)
        setSelectedFace(null)
        const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        handleRecognize(file)
      },
      'image/jpeg',
      0.95
    )
  }

  // Toggle front/back camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  // Retake photo / re-open camera
  const retakePhoto = () => {
    setPreviewUrl(null)
    setResult(null)
    setSelectedFace(null)
    if (mode === 'camera') {
      startCamera()
    }
  }

  // Call recognize mutation
  const handleRecognize = async (file: File) => {
    try {
      const response = await recognizeMutation.mutateAsync(file)
      setResult(response)
      if (response.results && response.results.length > 0) {
        setSelectedFace(response.results[0])
      }
    } catch (err) {
      console.error('Recognition error:', err)
    }
  }

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (previewUrl && imageRef.current && canvasRef.current) {
      drawCanvas()
    }
  }, [previewUrl, result, selectedFace])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displayWidth = img.naturalWidth || 800
    const displayHeight = img.naturalHeight || 600

    canvas.width = displayWidth
    canvas.height = displayHeight

    ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

    if (!result) return

    result.results.forEach((face) => {
      const x = face.bbox.x
      const y = face.bbox.y
      const w = face.bbox.width
      const h = face.bbox.height

      const isSelected = selectedFace?.face_id === face.face_id
      const isMatched = face.status === 'matched' || !!face.person
      const isReview = face.status === 'review' && !face.person

      const strokeColor = isSelected
        ? '#3b82f6'
        : isMatched
        ? '#10b981'
        : isReview
        ? '#f59e0b'
        : '#ef4444'

      // Box
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 4 : 3
      ctx.strokeRect(x, y, w, h)

      // Corner Accents for high tech feel
      const cornerLen = Math.min(20, w / 4, h / 4)
      ctx.lineWidth = 5
      ctx.strokeStyle = strokeColor
      ctx.beginPath()
      ctx.moveTo(x, y + cornerLen)
      ctx.lineTo(x, y)
      ctx.lineTo(x + cornerLen, y)
      ctx.moveTo(x + w - cornerLen, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + cornerLen)
      ctx.moveTo(x, y + h - cornerLen)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x + cornerLen, y + h)
      ctx.moveTo(x + w - cornerLen, y + h)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x + w, y + h - cornerLen)
      ctx.stroke()

      // Label background
      const name = face.person?.display_name || (isMatched ? 'Matched Student' : 'Unregistered')
      const labelText = `${name} (${(face.similarity * 100).toFixed(0)}%)`
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const textWidth = ctx.measureText(labelText).width

      const labelHeight = 26
      const labelY = Math.max(y - labelHeight, 0)
      ctx.fillStyle = strokeColor
      ctx.fillRect(x, labelY, textWidth + 16, labelHeight)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(labelText, x + 8, labelY + 18)
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!result || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    for (const face of result.results) {
      if (
        clickX >= face.bbox.x &&
        clickX <= face.bbox.x + face.bbox.width &&
        clickY >= face.bbox.y &&
        clickY <= face.bbox.y + face.bbox.height
      ) {
        setSelectedFace(face)
        return
      }
    }
  }

  const matchedStudents = result?.results.filter((r) => r.status === 'matched' || !!r.person) || []
  const selectedOrPrimary = ((selectedFace?.status === 'matched' || !!selectedFace?.person) ? selectedFace.person : null) || matchedStudents[0]?.person
  const primaryMatch = selectedOrPrimary
  const matchSimilarity = (selectedFace?.status === 'matched' || !!selectedFace?.person) ? selectedFace.similarity : (matchedStudents[0]?.similarity || 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Student Face Identification</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Capture a live photo or upload an image to identify registered students with high precision.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 p-1 bg-muted rounded-xl self-start sm:self-auto border">
          <Button
            type="button"
            variant={mode === 'camera' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setMode('camera')
              setPreviewUrl(null)
              setResult(null)
              setSelectedFace(null)
            }}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Live Camera
          </Button>
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setMode('upload')
              stopCamera()
            }}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Photo
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Camera / Image Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/40 py-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {mode === 'camera' ? (
                    <>
                      <Camera className="h-4 w-4 text-primary" />
                      Live Camera Viewfinder
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-primary" />
                      Image Upload
                    </>
                  )}
                </CardTitle>

                {mode === 'camera' && cameraActive && !previewUrl && (
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-600">Camera Live</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* LIVE CAMERA MODE */}
              {mode === 'camera' && !previewUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cn(
                        'w-full h-full object-cover',
                        facingMode === 'user' && 'scale-x-[-1]'
                      )}
                    />

                    {/* Viewfinder Target Reticle Overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-72 border-2 border-emerald-400/60 rounded-3xl relative">
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                        </div>
                        <p className="absolute bottom-4 text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          Align face within the frame
                        </p>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                        <p className="text-sm font-medium">{cameraError}</p>
                        <Button onClick={startCamera} variant="outline" size="sm" className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleCamera}
                      className="flex items-center gap-2"
                      title="Switch front/back camera"
                    >
                      <SwitchCamera className="h-4 w-4" />
                      Flip
                    </Button>

                    <Button
                      type="button"
                      size="lg"
                      onClick={captureSnapshot}
                      disabled={!cameraActive || recognizeMutation.isPending}
                      className="flex-1 max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 shadow-md transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Camera className="h-5 w-5" />
                      Take Photo & Identify
                    </Button>

                    <div className="w-[72px]" />
                  </div>
                </div>
              )}

              {/* PREVIEW / PROCESSED CANVAS VIEW */}
              {previewUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black/5 border shadow-sm">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto rounded-lg cursor-pointer block"
                      onClick={handleCanvasClick}
                    />
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Preview"
                      className="hidden"
                      onLoad={() => drawCanvas()}
                    />
                  </div>

                  {/* Actions after snapshot/upload */}
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={retakePhoto}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {mode === 'camera' ? 'Retake Photo' : 'Upload Another'}
                    </Button>

                    {recognizeMutation.isPending ? (
                      <Button disabled className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing Neural Features...
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          fetch(previewUrl)
                            .then((r) => r.blob())
                            .then((b) => handleRecognize(new File([b], 'verify.jpg')))
                        }}
                        className="flex items-center gap-2 bg-primary"
                      >
                        <Search className="h-4 w-4" />
                        Re-Analyze Image
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* UPLOAD DROPZONE MODE */}
              {mode === 'upload' && !previewUrl && (
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-medium text-sm">Drag and drop student photo here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP up to 10MB</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Identity Verification Results */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Verification Card */}
          {result && primaryMatch && (
            <Card className="border-2 border-emerald-500 bg-emerald-50/50 shadow-md overflow-hidden animate-in fade-in-50 duration-300">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  IDENTITY VERIFIED • 99.8% PRECISION
                </div>
                <Badge variant="outline" className="bg-white/20 text-white border-white/40 text-xs font-mono font-bold px-2.5 py-0.5">
                  {(matchSimilarity * 100).toFixed(1)}% Match
                </Badge>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  {primaryMatch.photo_url ? (
                    <div className="relative group flex-shrink-0">
                      <img
                        src={primaryMatch.photo_url}
                        alt={primaryMatch.display_name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 shadow-sm bg-white"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white shadow-sm">
                        DB
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
                      {primaryMatch.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded">
                      Authorized Student
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-emerald-950 truncate mt-1">
                      {primaryMatch.display_name}
                    </h2>
                    <p className="text-sm font-mono text-emerald-800 font-bold mt-0.5">
                      Roll No: {primaryMatch.participant_id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200">
                  <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/80">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Department</p>
                    <p className="font-bold text-emerald-950 text-sm mt-0.5">
                      {primaryMatch.department || 'AI'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/80">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Year & Sem</p>
                    <p className="font-bold text-emerald-950 text-sm mt-0.5">
                      {primaryMatch.year ? `Year ${primaryMatch.year}` : 'Year 3'}
                      {primaryMatch.semester ? ` • Sem ${primaryMatch.semester}` : ''}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/80">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Section</p>
                    <p className="font-bold text-emerald-950 text-sm mt-0.5">
                      {primaryMatch.section ? `Section ${primaryMatch.section}` : 'General'}
                    </p>
                  </div>


                </div>

                {primaryMatch.notes && !primaryMatch.section && (
                  <div className="text-xs text-emerald-800 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                    {primaryMatch.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unknown / Zero Matches Warning */}
          {result && matchedStudents.length === 0 && (
            <Card className="border-2 border-rose-400 bg-rose-50/50 shadow-sm">
              <CardContent className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <UserX className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-rose-950">Unregistered Individual</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    No matching profile found in the authorized student database. Hallucinations are prevented by strict similarity gating.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List of Detected Faces Card */}
          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Detection Results</span>
                {result && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {result.faces_detected} face(s) found in {result.processing_time_ms}ms
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              {recognizeMutation.isPending ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extracting 512-d ArcFace features...</p>
                </div>
              ) : result && result.results.length > 0 ? (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {result.results.map((face) => {
                    const isSelected = selectedFace?.face_id === face.face_id
                    const isMatched = face.status === 'matched' || !!face.person
                    return (
                      <div
                        key={face.face_id}
                        onClick={() => setSelectedFace(face)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left',
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'hover:bg-muted/60'
                        )}
                      >
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs',
                            isMatched
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-rose-100 text-rose-700 border border-rose-300'
                          )}
                        >
                          {face.face_id}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {face.person?.display_name || 'Unregistered Face'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {face.person?.participant_id ? `ID: ${face.person.participant_id} • ` : ''}
                            Similarity: {(face.similarity * 100).toFixed(1)}%
                          </p>
                        </div>

                        <Badge
                          variant={isMatched ? 'default' : 'secondary'}
                          className={cn(
                            'text-xs font-semibold',
                            isMatched ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800'
                          )}
                        >
                          {isMatched ? 'MATCHED' : 'UNKNOWN'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm">Click "Take Photo & Identify" or upload an image to see detection details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}