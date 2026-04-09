import { useCallback, useState } from 'react';
import { gameBus } from '../../game/event-bus';
import { DESIGN_W } from '../../game/layout-types';
import { usePress } from '../hooks/usePress';
import { purchaseAdRemove } from '../../game/services/billing';
import styles from './overlay.module.css';

const MAX_W = 500;
const scale = Math.min(window.innerWidth, MAX_W) / DESIGN_W;

interface Props {
  onClose: () => void;
}

const BENEFITS = [
  '부활 시 광고 영구 제거',
  '한 번 구매로 평생 적용',
  '쾌적한 퇴근길 보장',
];

export function AdRemoveOverlay({ onClose }: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const { handlers, pressStyle } = usePress();

  const handleClose = useCallback(() => {
    gameBus.emit('play-sfx', 'sfx-click');
    onClose();
  }, [onClose]);

  const handlePurchase = useCallback(async () => {
    if (purchasing) return;
    gameBus.emit('play-sfx', 'sfx-click');
    setPurchasing(true);
    try {
      const success = await purchaseAdRemove();
      if (success) onClose();
    } finally {
      setPurchasing(false);
    }
  }, [purchasing, onClose]);

  return (
    <div
      className={`${styles.overlay} ${styles.fadeIn}`}
      style={{ zIndex: 200 }}
      onClick={handleClose}
    >
      <div className={styles.dim} />

      {/* 모달 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${20 * scale}px`,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#2a292e',
            borderRadius: 20 * scale,
            padding: `${32 * scale}px ${24 * scale}px ${24 * scale}px`,
            width: '100%',
            maxWidth: 360 * scale,
            position: 'relative',
          }}
        >
          {/* X 버튼 */}
          <div
            onClick={handleClose}
            {...handlers('modal-close', handleClose)}
            style={{
              position: 'absolute',
              top: 12 * scale, right: 12 * scale,
              width: 28 * scale, height: 28 * scale,
              borderRadius: 999,
              background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              ...pressStyle('modal-close'),
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
            marginBottom: 6 * scale,
          }}>
            광고 제거
          </div>

          {/* 설명 */}
          <div style={{
            fontFamily: 'GMarketSans, sans-serif',
            fontWeight: 400,
            fontSize: 14 * scale,
            color: '#999',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 16 * scale,
          }}>
            부활 시 광고 없이<br />바로 이어서 퇴근할 수 있어요
          </div>

          {/* 혜택 카드 */}
          <div style={{
            background: '#1a1a1f',
            borderRadius: 14 * scale,
            padding: `${16 * scale}px ${20 * scale}px`,
            marginBottom: 16 * scale,
            textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {BENEFITS.map((text, i) => (
                <div key={i} style={{
                  fontFamily: 'GMarketSans, sans-serif',
                  fontWeight: 400,
                  fontSize: 15 * scale,
                  color: '#ddd',
                  lineHeight: 1.4,
                  marginTop: i > 0 ? 6 * scale : 0,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#888', marginRight: 6 * scale, flexShrink: 0 }}>✓</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* 가격 */}
            <div style={{
              fontFamily: 'GMarketSans, sans-serif',
              fontWeight: 900,
              fontSize: 24 * scale,
              color: '#fff',
              textAlign: 'center',
              marginTop: 14 * scale,
            }}>
              1,900원
            </div>
          </div>

          {/* 구매하기 버튼 */}
          <div
            onClick={handlePurchase}
            {...handlers('purchase-btn', handlePurchase)}
            style={{
              background: '#000',
              borderRadius: 12 * scale,
              padding: `${14 * scale}px`,
              textAlign: 'center',
              cursor: 'pointer',
              ...pressStyle('purchase-btn'),
            }}
          >
            <span style={{
              fontFamily: 'GMarketSans, sans-serif',
              fontWeight: 700,
              fontSize: 20 * scale,
              color: '#fff',
            }}>
              {purchasing ? '처리 중...' : '구매하기'}
            </span>
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
