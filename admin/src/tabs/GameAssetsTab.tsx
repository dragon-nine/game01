import type { AssetCategory } from '../types'
import CategorySection from '../components/CategorySection'

const CATEGORIES: AssetCategory[] = [
  { key: 'character', label: '캐릭터', prefix: 'game01/character/', accept: 'image/*' },
  { key: 'map', label: '맵 타일', prefix: 'game01/map/', accept: 'image/*' },
  { key: 'obstacles', label: '장애물', prefix: 'game01/obstacles/', accept: 'image/*' },
  { key: 'ui', label: 'UI', prefix: 'game01/ui/', accept: 'image/*' },
  { key: 'audio', label: '오디오', prefix: 'game01/audio/', accept: 'audio/*' },
]

interface Props {
  onBanner: (type: 'success' | 'error', message: string) => void
}

export default function GameAssetsTab({ onBanner }: Props) {
  return (
    <div>
      {CATEGORIES.map((cat) => (
        <CategorySection
          key={cat.key}
          label={cat.label}
          prefix={cat.prefix}
          accept={cat.accept}
          onBanner={onBanner}
        />
      ))}
    </div>
  )
}
