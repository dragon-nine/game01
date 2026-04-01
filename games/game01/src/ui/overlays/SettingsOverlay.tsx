import { gameBus } from '../../game/event-bus';
import { DESIGN_W } from '../../game/layout-types';
import { useAudioToggles } from '../hooks/useAudioToggles';
import { usePress } from '../hooks/usePress';
import styles from './overlay.module.css';

const MAX_W = 500;
const scale = Math.min(window.innerWidth, MAX_W) / DESIGN_W;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const w = 52 * scale;
  const h = 30 * scale;
  const knob = h - 4 * scale;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: on ? '#4ade80' : '#434750',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        touchAction: 'manipulation',
      }}
    >
      <div style={{
        width: knob,
        height: knob,
        borderRadius: knob / 2,
        background: on ? '#fff' : '#888',
        position: 'absolute',
        top: 2 * scale,
        left: on ? w - knob - 2 * scale : 2 * scale,
        transition: 'left 0.2s, background 0.2s',
      }} />
    </div>
  );
}

export function SettingsOverlay() {
  const { bgmMuted, sfxMuted, handleBgmToggle, handleSfxToggle } = useAudioToggles();
  const { handlers, pressStyle } = usePress();

  const handleClose = () => {
    gameBus.emit('play-sfx', 'sfx-click');
    gameBus.emit('screen-change', 'main');
  };

  return (
    <div className={`${styles.overlay} ${styles.fadeIn}`} onClick={handleClose}>
      <div className={styles.dim} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${20 * scale}px`,
      }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#2a292e',
            borderRadius: 20 * scale,
            padding: `${32 * scale}px ${24 * scale}px ${24 * scale}px`,
            width: '100%',
            maxWidth: 340 * scale,
            position: 'relative',
          }}
        >
          {/* X 버튼 */}
          <div
            onClick={handleClose}
            {...handlers('settings-close')}
            style={{
              position: 'absolute',
              top: 12 * scale, right: 12 * scale,
              width: 28 * scale, height: 28 * scale,
              borderRadius: 999,
              background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              ...pressStyle('settings-close'),
            }}
          >
            <span style={{ color: '#fff', fontSize: 14 * scale, fontWeight: 700, lineHeight: 1 }}>✕</span>
          </div>

          {/* 타이틀 */}
          <div style={{
            fontFamily: 'GMarketSans, sans-serif',
            fontWeight: 900,
            fontSize: 30 * scale,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 20 * scale,
          }}>
            설정
          </div>

          {/* 설정 카드 */}
          <div style={{
            background: '#1a1a1f',
            borderRadius: 14 * scale,
            padding: `${20 * scale}px ${28 * scale}px`,
          }}>
            {/* 음악 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16 * scale,
            }}>
              <span style={{
                fontFamily: 'GMarketSans, sans-serif',
                fontWeight: 700,
                fontSize: 22 * scale,
                color: '#ddd',
              }}>
                음악
              </span>
              <Toggle on={!bgmMuted} onToggle={handleBgmToggle} />
            </div>

            {/* 효과음 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'GMarketSans, sans-serif',
                fontWeight: 700,
                fontSize: 22 * scale,
                color: '#ddd',
              }}>
                효과음
              </span>
              <Toggle on={!sfxMuted} onToggle={handleSfxToggle} />
            </div>
          </div>
        </div>

        {/* 안내 텍스트 — 모달 바로 아래 */}
        <div style={{
          fontFamily: 'GMarketSans, sans-serif',
          fontSize: 13 * scale,
          color: '#434750',
          textAlign: 'center',
          marginTop: 12 * scale,
        }}>
          화면 터치 시 이전으로 이동
        </div>
      </div>
    </div>
  );
}
