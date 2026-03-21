import { useState, useEffect, useCallback } from 'react'
import type { BlobItem, StoreAssetSpec } from '../types'
import { listBlobs, uploadBlob, deleteBlob } from '../api'
import UploadZone from '../components/UploadZone'
import AssetCard from '../components/AssetCard'
import SpecBadge from '../components/SpecBadge'

const SPECS: StoreAssetSpec[] = [
  {
    key: 'icon',
    label: '앱 아이콘',
    width: 512, height: 512,
    format: 'PNG (32bit, alpha)',
    maxSize: 1024 * 1024,
    minCount: 1, maxCount: 1,
    prefix: 'store/google-play/icon/',
  },
  {
    key: 'feature',
    label: '피처 그래픽',
    width: 1024, height: 500,
    format: 'JPEG / PNG',
    minCount: 1, maxCount: 1,
    prefix: 'store/google-play/feature/',
  },
  {
    key: 'phone',
    label: '폰 스크린샷',
    width: 1080, height: 1920,
    format: 'JPEG / PNG',
    maxSize: 8 * 1024 * 1024,
    minCount: 2, maxCount: 8,
    prefix: 'store/google-play/phone/',
  },
  {
    key: 'tablet7',
    label: '태블릿 7" 스크린샷',
    width: 1080, height: 1920,
    format: 'JPEG / PNG',
    maxSize: 8 * 1024 * 1024,
    minCount: 4, maxCount: 8,
    prefix: 'store/google-play/tablet7/',
  },
  {
    key: 'tablet10',
    label: '태블릿 10" 스크린샷',
    width: 1080, height: 1920,
    format: 'JPEG / PNG',
    maxSize: 8 * 1024 * 1024,
    minCount: 4, maxCount: 8,
    prefix: 'store/google-play/tablet10/',
  },
]

interface Props {
  onBanner: (type: 'success' | 'error', message: string) => void
}

function validateImage(file: File, spec: StoreAssetSpec): Promise<string | null> {
  return new Promise((resolve) => {
    if (spec.maxSize && file.size > spec.maxSize) {
      resolve(`파일 크기 초과: ${(file.size / (1024 * 1024)).toFixed(1)}MB (최대 ${(spec.maxSize / (1024 * 1024)).toFixed(0)}MB)`)
      return
    }
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth !== spec.width || img.naturalHeight !== spec.height) {
        resolve(`크기 불일치: ${img.naturalWidth}x${img.naturalHeight} (필요: ${spec.width}x${spec.height})`)
      } else {
        resolve(null)
      }
    }
    img.onerror = () => resolve('이미지를 읽을 수 없습니다')
    img.src = URL.createObjectURL(file)
  })
}

function StoreSection({ spec, onBanner }: { spec: StoreAssetSpec; onBanner: Props['onBanner'] }) {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setBlobs(await listBlobs(spec.prefix))
    } catch (err) {
      onBanner('error', `${spec.label} 로드 실패: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [spec, onBanner])

  useEffect(() => { refresh() }, [refresh])

  const handleUpload = useCallback(async (files: File[]) => {
    if (blobs.length + files.length > spec.maxCount) {
      onBanner('error', `최대 ${spec.maxCount}개까지 업로드할 수 있습니다 (현재 ${blobs.length}개)`)
      return
    }
    for (const file of files) {
      const err = await validateImage(file, spec)
      if (err) {
        onBanner('error', `"${file.name}": ${err}`)
        return
      }
      try {
        await uploadBlob(file, spec.prefix)
      } catch (e) {
        onBanner('error', `"${file.name}" 업로드 실패: ${(e as Error).message}`)
        return
      }
    }
    onBanner('success', `${files.length}개 파일 업로드 완료`)
    refresh()
  }, [blobs.length, spec, onBanner, refresh])

  const handleDelete = useCallback(async (url: string) => {
    try {
      await deleteBlob(url)
      onBanner('success', '삭제 완료')
      refresh()
    } catch (err) {
      onBanner('error', `삭제 실패: ${(err as Error).message}`)
    }
  }, [onBanner, refresh])

  const countStatus = blobs.length < spec.minCount
    ? `${blobs.length} / ${spec.minCount} (최소 ${spec.minCount}개 필요)`
    : `${blobs.length} / ${spec.maxCount}`

  return (
    <div className="card">
      <div className="section-header">
        <div className="card-title">
          {spec.label}
          <SpecBadge
            width={spec.width}
            height={spec.height}
            format={spec.format}
            maxSize={spec.maxSize}
          />
        </div>
        <span className="section-count">{countStatus}</span>
      </div>
      {blobs.length < spec.maxCount && (
        <UploadZone
          accept="image/png,image/jpeg"
          multiple={spec.maxCount > 1}
          onUpload={handleUpload}
          hint={`${spec.width}x${spec.height} ${spec.format}`}
        />
      )}
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

export default function GooglePlayTab({ onBanner }: Props) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 16, background: 'var(--accent-light)' }}>
        <div style={{ fontSize: 14, color: 'var(--accent-dark)' }}>
          Google Play 스토어 등록에 필요한 이미지를 관리합니다. 업로드 시 크기와 포맷이 자동 검증됩니다.
        </div>
      </div>
      {SPECS.map((spec) => (
        <StoreSection key={spec.key} spec={spec} onBanner={onBanner} />
      ))}
    </div>
  )
}
