import { useState, useEffect, useCallback } from 'react'
import type { BlobItem } from '../types'
import { listBlobs, uploadBlob, deleteBlob } from '../api'
import UploadZone from '../components/UploadZone'
import AssetCard from '../components/AssetCard'

const SECTIONS = [
  {
    key: 'icon',
    label: '앱 아이콘',
    prefix: 'store/toss/icon/',
    hint: '토스 인앱 등록용 아이콘',
    maxCount: 1,
  },
  {
    key: 'screenshots',
    label: '스크린샷',
    prefix: 'store/toss/screenshots/',
    hint: '토스 인앱 등록용 스크린샷',
    maxCount: 8,
  },
  {
    key: 'etc',
    label: '기타 이미지',
    prefix: 'store/toss/etc/',
    hint: '배너, 프로모션 이미지 등',
    maxCount: 10,
  },
]

interface Props {
  onBanner: (type: 'success' | 'error', message: string) => void
}

function TossSection({ section, onBanner }: { section: typeof SECTIONS[number]; onBanner: Props['onBanner'] }) {
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setBlobs(await listBlobs(section.prefix))
    } catch (err) {
      onBanner('error', `${section.label} 로드 실패: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [section, onBanner])

  useEffect(() => { refresh() }, [refresh])

  const handleUpload = useCallback(async (files: File[]) => {
    if (blobs.length + files.length > section.maxCount) {
      onBanner('error', `최대 ${section.maxCount}개까지 업로드 가능`)
      return
    }
    for (const file of files) {
      try {
        await uploadBlob(file, section.prefix)
      } catch (err) {
        onBanner('error', `"${file.name}" 업로드 실패: ${(err as Error).message}`)
        return
      }
    }
    onBanner('success', `${files.length}개 파일 업로드 완료`)
    refresh()
  }, [blobs.length, section, onBanner, refresh])

  const handleDelete = useCallback(async (url: string) => {
    try {
      await deleteBlob(url)
      onBanner('success', '삭제 완료')
      refresh()
    } catch (err) {
      onBanner('error', `삭제 실패: ${(err as Error).message}`)
    }
  }, [onBanner, refresh])

  return (
    <div className="card">
      <div className="section-header">
        <div className="card-title">{section.label}</div>
        <span className="section-count">{blobs.length} / {section.maxCount}</span>
      </div>
      {blobs.length < section.maxCount && (
        <UploadZone accept="image/*" multiple={section.maxCount > 1} onUpload={handleUpload} hint={section.hint} />
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

export default function TossInAppTab({ onBanner }: Props) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 16, background: 'var(--accent-light)' }}>
        <div style={{ fontSize: 14, color: 'var(--accent-dark)' }}>
          토스 인앱 스토어 등록에 필요한 이미지를 관리합니다.
          스펙이 확정되면 크기 검증이 추가됩니다.
        </div>
      </div>
      {SECTIONS.map((s) => (
        <TossSection key={s.key} section={s} onBanner={onBanner} />
      ))}
    </div>
  )
}
