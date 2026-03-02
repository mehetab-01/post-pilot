import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, File, ImageIcon, VideoIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { uploadMedia } from '@/services/generate'

const ACCEPT = {
  'image/jpeg': [],
  'image/png':  [],
  'image/gif':  [],
  'image/webp': [],
  'video/mp4':  [],
  'video/webm': [],
}
const MAX_SIZE = 50 * 1024 * 1024  // 50 MB

function MediaThumb({ item, onRemove }) {
  const isVideo = item.file.type.startsWith('video/')
  const isUploading = item.uploading

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      className="relative group flex-shrink-0"
    >
      <div className={clsx(
        'w-20 h-20 rounded-xl border border-border overflow-hidden bg-surface-2',
        'flex items-center justify-center',
        isUploading && 'opacity-50',
      )}>
        {item.preview ? (
          isVideo
            ? <video src={item.preview} className="w-full h-full object-cover" muted />
            : <img src={item.preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <File size={24} className="text-muted" />
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-bg/60 flex items-center justify-center rounded-xl">
            <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Type badge */}
      <span className="absolute bottom-1 left-1 flex items-center justify-center w-5 h-5 rounded-md bg-black/70">
        {isVideo
          ? <VideoIcon size={10} className="text-white" />
          : <ImageIcon size={10} className="text-white" />
        }
      </span>

      {/* Remove button */}
      {!isUploading && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-700 border border-border
                     flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-900 hover:border-red-800"
        >
          <X size={10} className="text-white" />
        </button>
      )}
    </motion.div>
  )
}

export function MediaUploader({ files, onFilesChange }) {
  const onDrop = useCallback(async (accepted, rejected) => {
    if (rejected.length) {
      const reason = rejected[0].errors[0]?.message ?? 'File rejected'
      toast.error(`Upload error: ${reason}`)
    }

    const newItems = accepted.map((file) => ({
      id:        crypto.randomUUID(),
      file,
      preview:   file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      uploading: true,
      uploadedId: null,
    }))

    onFilesChange((prev) => [...prev, ...newItems])

    // Upload each file to backend
    for (const item of newItems) {
      try {
        const media = await uploadMedia(item.file)
        onFilesChange((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, uploading: false, uploadedId: media.id } : f
          )
        )
      } catch {
        toast.error(`Failed to upload ${item.file.name}`)
        onFilesChange((prev) => prev.filter((f) => f.id !== item.id))
      }
    }
  }, [onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: true,
  })

  function removeFile(id) {
    onFilesChange((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={clsx(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
          'py-6 cursor-pointer transition-all duration-200 text-center',
          isDragActive
            ? 'border-amber bg-amber/5'
            : 'border-border hover:border-zinc-600 hover:bg-surface',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud
          size={22}
          className={clsx('transition-colors', isDragActive ? 'text-amber' : 'text-muted')}
        />
        <div>
          <p className={clsx('text-sm font-medium transition-colors', isDragActive ? 'text-amber' : 'text-text')}>
            {isDragActive ? 'Drop to upload' : 'Drag files or click to browse'}
          </p>
          <p className="text-xs text-muted mt-0.5">JPG, PNG, GIF, WEBP, MP4, WEBM — max 50 MB</p>
        </div>
      </div>

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {files.map((item) => (
              <MediaThumb key={item.id} item={item} onRemove={removeFile} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
