import { useState, useCallback, useRef, useEffect } from 'react'
import type { BlobItem } from '../types'
import { listBlobs, uploadBlob, deleteBlob } from '../api'
import ImageCropper from '../components/ImageCropper'
import DownloadCropper from '../components/DownloadCropper'
import LazyImage from '../components/LazyImage'

/* ── Types ── */

interface DownloadOption {
  platform: string
  width: number
  height: number
  mode: 'resize' | 'crop'  // resize=자동, crop=크로퍼로 위치 조정
}

interface AssetGroup {
  key: string
  label: string
  desc: string
  accept: string
  maxCount: number
  storeWidth: number   // Blob에 저장되는 크기
  storeHeight: number
  prefix: string
  downloads: DownloadOption[]
  exactOnly?: boolean  // true면 정확한 크기만 허용, 크로퍼 없이 바로 업로드
  fileBaseName: string  // 저장/다운로드 시 사용할 영문 파일명 (확장자 제외)
}

function buildGroups(gameId: string): AssetGroup[] {
  return [
    {
      key: 'icon',
      label: '앱 아이콘',
      fileBaseName: 'app_icon',
      desc: '600x600',
      accept: 'image/png',
      maxCount: 1,
      storeWidth: 600, storeHeight: 600,
      exactOnly: true,
      prefix: `launch/${gameId}/icon/`,
      downloads: [
        { platform: '토스', width: 600, height: 600, mode: 'resize' },
        { platform: 'Google Play', width: 512, height: 512, mode: 'resize' },
      ],
    },
    {
      key: 'feature',
      label: '대표 이미지',
      fileBaseName: 'feature_image',
      desc: '1932x828',
      accept: 'image/png,image/jpeg',
      maxCount: 1,
      storeWidth: 1932, storeHeight: 828,
      exactOnly: true,
      prefix: `launch/${gameId}/feature/`,
      downloads: [
        { platform: '토스', width: 1932, height: 828, mode: 'resize' },
        { platform: 'Google Play', width: 1024, height: 500, mode: 'resize' },
      ],
    },
    {
      key: 'screenshots',
      label: '스크린샷',
      fileBaseName: 'screenshot',
      desc: '636x1048',
      accept: 'image/png,image/jpeg',
      maxCount: 8,
      storeWidth: 636, storeHeight: 1048,
      prefix: `launch/${gameId}/screenshots/`,
      downloads: [],
    },
  ]
}

/* ── Props ── */

interface Props {
  gameId: string
  gameName: string
  onBanner: (type: 'success' | 'error', message: string) => void
}

/* ── Helpers ── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getFilename(pathname: string): string {
  return pathname.split('/').pop() || pathname
}

function triggerDownload(blobUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

function proxyUrl(url: string): string {
  return `/api/blob-image?url=${encodeURIComponent(url)}`
}

// Download original file as-is
async function downloadOriginal(url: string, filename: string) {
  const res = await fetch(proxyUrl(url))
  const data = await res.blob()
  triggerDownload(URL.createObjectURL(data), filename)
}

// Download resized version
async function downloadResized(url: string, filename: string, targetW: number, targetH: number) {
  const res = await fetch(proxyUrl(url))
  const data = await res.blob()
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject()
    img.src = URL.createObjectURL(data)
  })
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, targetW, targetH)
  URL.revokeObjectURL(img.src)
  canvas.toBlob((blob) => {
    if (!blob) return
    triggerDownload(URL.createObjectURL(blob), filename)
  }, 'image/png', 0.95)
}

/* ── Group Component ── */

function LaunchGroup({ group, onBanner }: { group: AssetGroup; onBanner: Props['onBanner'] }) {
  const addRef = useRef<HTMLInputElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [blobs, setBlobs] = useState<BlobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [downloadCropUrl, setDownloadCropUrl] = useState<{ url: string; filename: string; opt: DownloadOption } | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const items = await listBlobs(group.prefix)
      setBlobs(items)
    } catch {
      // API unavailable
    } finally {
      setLoading(false)
    }
  }, [group.prefix])

  useEffect(() => { refresh() }, [refresh])

  const doUpload = useCallback(async (file: File) => {
    if (uploading) return
    setUploading(true)
    try {
      // exactOnly + maxCount 1 → 기존 파일 삭제 후 업로드
      if (group.exactOnly && blobs.length > 0) {
        for (const b of blobs) {
          await deleteBlob(b.url)
        }
      }
      await uploadBlob(file, group.prefix, file.name)
      onBanner('success', '등록 완료')
      await refresh()
    } catch (err) {
      onBanner('error', `업로드 실패: ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }, [uploading, blobs, group.exactOnly, group.prefix, onBanner, refresh])

  const handleFileSelected = useCallback((files: File[]) => {
    if (uploading) return
    if (blobs.length + files.length > group.maxCount) {
      onBanner('error', `최대 ${group.maxCount}개까지`)
      return
    }
    const file = files[0]
    if (!file) return

    if (group.exactOnly) {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        if (img.naturalWidth !== group.storeWidth || img.naturalHeight !== group.storeHeight) {
          onBanner('error', `${group.storeWidth}x${group.storeHeight} 이미지만 업로드 가능합니다 (현재: ${img.naturalWidth}x${img.naturalHeight})`)
          return
        }
        const ext = file.name.match(/\.\w+$/)?.[0] || '.png'
        const renamed = new File([file], `${group.fileBaseName}${ext}`, { type: file.type })
        doUpload(renamed)
      }
      img.src = URL.createObjectURL(file)
    } else {
      setCropFile(file)
    }
  }, [uploading, blobs, group.maxCount, group.exactOnly, group.storeWidth, group.storeHeight, group.fileBaseName, onBanner, doUpload])

  const handleCropped = useCallback((croppedFile: File) => {
    setCropFile(null)
    const ext = croppedFile.name.match(/\.\w+$/)?.[0] || '.png'
    const num = String(blobs.length + 1).padStart(2, '0')
    const named = new File([croppedFile], `${group.fileBaseName}_${num}${ext}`, { type: croppedFile.type })
    doUpload(named)
  }, [blobs.length, group.fileBaseName, doUpload])

  const handleDelete = useCallback(async (url: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeleting(prev => new Set(prev).add(url))
    try {
      await deleteBlob(url)
      onBanner('success', '삭제 완료')
      await refresh()
    } catch (err) {
      onBanner('error', `삭제 실패: ${(err as Error).message}`)
    } finally {
      setDeleting(prev => { const next = new Set(prev); next.delete(url); return next })
    }
  }, [onBanner, refresh])

  const handleDownload = useCallback(async (blob: BlobItem, opt: DownloadOption) => {
    const key = `${blob.url}-${opt.platform}`
    if (downloading) return
    setDownloading(key)
    try {
      const origName = getFilename(blob.pathname)
      const ext = origName.match(/\.\w+$/)?.[0] || '.png'
      const platformTag = opt.platform === '토스' ? 'toss' : 'google_play'
      const dlName = `${group.fileBaseName}_${platformTag}${ext}`
      if (opt.width === group.storeWidth && opt.height === group.storeHeight) {
        await downloadOriginal(blob.url, dlName)
      } else if (opt.mode === 'resize') {
        await downloadResized(blob.url, dlName, opt.width, opt.height)
      } else {
        setDownloadCropUrl({ url: blob.url, filename: dlName, opt })
      }
    } finally {
      setDownloading(null)
    }
  }, [group.storeWidth, group.storeHeight, group.fileBaseName, downloading])

  const handleDownloadOriginal = useCallback(async (blob: BlobItem) => {
    const key = `${blob.url}-original`
    if (downloading) return
    setDownloading(key)
    try {
      const fname = getFilename(blob.pathname)
      await downloadOriginal(blob.url, fname)
    } finally {
      setDownloading(null)
    }
  }, [downloading])

  return (
    <div className="card">
      <div className="category-header">
        <button className="category-toggle" onClick={() => setCollapsed(!collapsed)}>
          <span className={`sidebar-chevron${collapsed ? '' : ' open'}`}>&#9656;</span>
          <span className="card-title" style={{ marginBottom: 0 }}>{group.label}</span>
          {group.desc && <span className="spec-badge">{group.desc}</span>}
          {!group.exactOnly && <span className="section-count">{blobs.length} / {group.maxCount}</span>}
        </button>
        {blobs.length < group.maxCount && (
          <>
            <button className="category-add-btn"
              onClick={(e) => { e.stopPropagation(); addRef.current?.click() }}
              disabled={uploading}
              title="추가">{uploading ? '...' : '+'}</button>
            <input ref={addRef} type="file" accept={group.accept}
              multiple={group.maxCount > 1} style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files) handleFileSelected(Array.from(e.target.files)); e.target.value = '' }} />
          </>
        )}
      </div>

      {!collapsed && (
        loading ? (
          <div className="empty">로딩 중...</div>
        ) : blobs.length === 0 ? (
          <div className="empty">업로드된 이미지가 없습니다</div>
        ) : (
          <div className="lp-cards">
            {blobs.map((b) => {
              const fname = getFilename(b.pathname)
              const isBusyDelete = deleting.has(b.url)
              return (
                <div key={b.url} className={`lp-card${isBusyDelete ? ' busy' : ''}`}>
                  <div className="lp-card-preview">
                    <LazyImage src={proxyUrl(b.url)} alt={fname}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button className="lp-delete-corner" onClick={() => handleDelete(b.url)}
                      disabled={isBusyDelete} title="삭제">&times;</button>
                  </div>
                  <div className="lp-card-body">
                    {!group.exactOnly && (
                      <div className="lp-card-info">
                        <span className="lp-card-name" title={fname}>{fname}</span>
                        <span className="lp-card-meta">{group.storeWidth}x{group.storeHeight} / {formatSize(b.size)}</span>
                      </div>
                    )}
                    <div className="lp-card-downloads">
                      {group.downloads.length > 0 ? group.downloads.map((opt) => {
                        const dlKey = `${b.url}-${opt.platform}`
                        const isBusy = downloading === dlKey
                        return (
                          <button key={opt.platform} className="lp-dl-btn"
                            onClick={() => handleDownload(b, opt)}
                            title={`${opt.platform} ${opt.width}x${opt.height}`}
                            disabled={!!downloading}>
                            <span className="lp-dl-platform">{isBusy ? '...' : opt.platform}</span>
                            <span className="lp-dl-size">{opt.width}x{opt.height}</span>
                            {opt.mode === 'crop' && <span className="lp-dl-crop">위치 조정</span>}
                          </button>
                        )
                      }) : (
                        <button className="lp-dl-btn"
                          onClick={() => handleDownloadOriginal(b)}
                          title="다운로드"
                          disabled={!!downloading}>
                          <span className="lp-dl-platform">{downloading === `${b.url}-original` ? '...' : '다운로드'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {uploading && (
        <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)' }}>
          <div className="upload-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
          업로드 중...
        </div>
      )}

      {cropFile && (
        <ImageCropper
          file={cropFile}
          targetWidth={group.storeWidth}
          targetHeight={group.storeHeight}
          onCropped={handleCropped}
          onCancel={() => setCropFile(null)}
        />
      )}

      {downloadCropUrl && (
        <DownloadCropper
          imageUrl={proxyUrl(downloadCropUrl.url)}
          sourceWidth={group.storeWidth}
          sourceHeight={group.storeHeight}
          targetWidth={downloadCropUrl.opt.width}
          targetHeight={downloadCropUrl.opt.height}
          filename={downloadCropUrl.filename}
          onDone={() => setDownloadCropUrl(null)}
        />
      )}
    </div>
  )
}

/* ── Main ── */

export default function LaunchPrepTab({ gameId, gameName, onBanner }: Props) {
  const groups = buildGroups(gameId)
  return (
    <div>
      <h1 className="page-title">출시 준비</h1>
      <p className="page-subtitle">{gameName} — 이미지 하나로 관리, 플랫폼별 다운로드</p>
      <div className="lp-info">
        원본 이미지를 하나 올리고, 다운로드 버튼으로 각 플랫폼에 맞는 크기로 받으세요.
      </div>
      <div className="lp-row">
        <LaunchGroup group={groups[0]} onBanner={onBanner} />
        <LaunchGroup group={groups[1]} onBanner={onBanner} />
      </div>
      <LaunchGroup group={groups[2]} onBanner={onBanner} />
    </div>
  )
}
