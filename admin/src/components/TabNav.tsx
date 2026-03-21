import type { TabId } from '../types'

const TABS: { id: TabId; label: string }[] = [
  { id: 'game-assets', label: '게임 에셋' },
  { id: 'google-play', label: 'Google Play' },
  { id: 'toss', label: '토스 인앱' },
]

interface Props {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export default function TabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="tab-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={activeTab === t.id ? 'active' : ''}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
