import { useState, useEffect, useCallback } from 'react'
import type { BlobItem } from '../types'
import { listBlobs, uploadBlob, deleteBlob } from '../api'
import UploadZone from './UploadZone'
import AssetCard from './AssetCard'

interface Props {
  label: string
  prefix: string
  accept: string
  onBanner: (type: 'success' | 'error', message: string) => void
}

export default function CategorySection({ label, prefix, accept, onBanner }: Props) {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const items = await listBlobs(prefix)
      setBlobs(items)
    } catch (err) {
      onBanner('error', `${label} 목록 로드 실패: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [prefix, label, onBanner])

  useEffect(() => { refresh() }, [refresh])

  const handleUpload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          await uploadBlob(file, prefix)
        } catch (err) {
          onBanner('error', `"${file.name}" 업로드 실패: ${(err as Error).message}`)
          return
        }
      }
      onBanner('success', `${files.length}개 파일 업로드 완료`)
      refresh()
    },
    [prefix, onBanner, refresh],
  )

  const handleDelete = useCallback(
    async (url: string) => {
      try {
        await deleteBlob(url)
        onBanner('success', '삭제 완료')
        refresh()
      } catch (err) {
        onBanner('error', `삭제 실패: ${(err as Error).message}`)
      }
    },
    [onBanner, refresh],
  )

  return (
    <div className="card">
      <div className="section-header">
        <div className="card-title">{label}</div>
        <span className="section-count">{blobs.length}개</span>
      </div>
      <UploadZone accept={accept} onUpload={handleUpload} hint={`${label} 파일을 업로드하세요`} />
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : blobs.length === 0 ? (
        <div className="empty" style={{ marginTop: 12 }}>업로드된 파일이 없습니다</div>
      ) : (
        <div className="asset-grid" style={{ marginTop: 16 }}>
          {blobs.map((b) => (
            <AssetCard key={b.url} blob={b} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
