import { useRef, useState, useCallback } from 'react'

interface Props {
  accept: string
  multiple?: boolean
  onUpload: (files: File[]) => Promise<void>
  hint?: string
}

export default function UploadZone({ accept, multiple = true, onUpload, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)
      try {
        await onUpload(Array.from(files))
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [onUpload],
  )

  return (
    <div
      className={`upload-zone${dragover ? ' dragover' : ''}${uploading ? ' uploading' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragover(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="upload-zone-icon">{uploading ? '...' : '+'}</div>
      <div className="upload-zone-text">
        {uploading ? '업로드 중...' : '클릭 또는 드래그하여 업로드'}
      </div>
      {hint && <div className="upload-zone-hint">{hint}</div>}
    </div>
  )
}
