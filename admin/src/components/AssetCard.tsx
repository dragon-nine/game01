import { useState, useEffect } from 'react'
import type { BlobItem } from '../types'

interface Props {
  blob: BlobItem
  onDelete: (url: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getFilename(pathname: string): string {
  return pathname.split('/').pop() || pathname
}

function isAudio(pathname: string): boolean {
  return /\.(mp3|ogg|wav|m4a)$/i.test(pathname)
}

export default function AssetCard({ blob, onDelete }: Props) {
  const [dims, setDims] = useState<string>('')
  const audio = isAudio(blob.pathname)
  const filename = getFilename(blob.pathname)

  useEffect(() => {
    if (audio) return
    const img = new Image()
    img.onload = () => setDims(`${img.naturalWidth}x${img.naturalHeight}`)
    img.src = blob.url
  }, [blob.url, audio])

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`"${filename}" 삭제하시겠습니까?`)) {
      onDelete(blob.url)
    }
  }

  return (
    <div className="asset-card">
      <div className={`asset-card-preview${audio ? ' audio' : ''}`}>
        {audio ? (
          <span>&#9835;</span>
        ) : (
          <img src={blob.url} alt={filename} loading="lazy" />
        )}
      </div>
      <div className="asset-card-info">
        <div className="asset-card-name" title={filename}>{filename}</div>
        <div className="asset-card-meta">
          <span>{dims ? `${dims} / ` : ''}{formatSize(blob.size)}</span>
          <button className="asset-card-delete" onClick={handleDelete} title="삭제">
            &#x2715;
          </button>
        </div>
      </div>
    </div>
  )
}
