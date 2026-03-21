import { useState, useCallback } from 'react'
import type { TabId } from './types'
import TabNav from './components/TabNav'
import GameAssetsTab from './tabs/GameAssetsTab'
import GooglePlayTab from './tabs/GooglePlayTab'
import TossInAppTab from './tabs/TossInAppTab'
import Banner from './components/Banner'

function getInitialTab(): TabId {
  const params = new URLSearchParams(window.location.search)
  return (params.get('tab') as TabId) || 'game-assets'
}

export default function App() {
  const [tab, setTab] = useState<TabId>(getInitialTab)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleTabChange = useCallback((newTab: TabId) => {
    setTab(newTab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    window.history.replaceState({}, '', url.toString())
  }, [])

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    setBanner({ type, message })
  }, [])

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-logo">D9</div>
        <h1>Dragon Nine Admin</h1>
      </header>
      <TabNav activeTab={tab} onTabChange={handleTabChange} />
      <main className="admin-content">
        {tab === 'game-assets' && <GameAssetsTab onBanner={showBanner} />}
        {tab === 'google-play' && <GooglePlayTab onBanner={showBanner} />}
        {tab === 'toss' && <TossInAppTab onBanner={showBanner} />}
      </main>
      {banner && (
        <Banner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
      )}
    </div>
  )
}
