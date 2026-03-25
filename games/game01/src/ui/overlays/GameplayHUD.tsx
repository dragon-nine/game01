import { useState, useEffect, useCallback } from 'react';
import { gameBus } from '../../game/event-bus';
import { useLayout } from '../hooks/useLayout';
import styles from './overlay.module.css';

const BASE = import.meta.env.BASE_URL || '/';

const IMAGE_MAP: Record<string, string> = {
  'gauge-bar': 'ui/gauge-empty.png',
  'btn-pause': 'ui/btn-pause.png',
  'btn-switch': 'ui/btn-switch.png',
  'btn-forward': 'ui/btn-forward.png',
};

export function GameplayHUD() {
  const { positions, elements, scale, ready } = useLayout('gameplay', IMAGE_MAP);
  const [score, setScore] = useState(0);
  const [timerPct, setTimerPct] = useState(1);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const unsub1 = gameBus.on('score-update', setScore);
    const unsub2 = gameBus.on('timer-update', setTimerPct);
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleSwitch = useCallback(() => {
    setShowGuide(false);
    gameBus.emit('action-switch', undefined);
  }, []);

  const handleForward = useCallback(() => {
    setShowGuide(false);
    gameBus.emit('action-forward', undefined);
  }, []);

  const handlePause = useCallback(() => {
    gameBus.emit('action-pause', undefined);
  }, []);

  const handleBtnDown = useCallback((id: string) => {
    setPressedBtn(id);
    setTimeout(() => setPressedBtn(null), 80);
  }, []);

  if (!ready) return null;

  const pos = (id: string) => positions.get(id);

  const boxStyle = (id: string): React.CSSProperties => {
    const p = pos(id);
    if (!p) return { display: 'none' };
    return {
      position: 'absolute',
      left: p.x - p.displayWidth * p.originX,
      top: p.y - p.displayHeight * p.originY,
      width: p.displayWidth,
      height: p.displayHeight,
    };
  };

  const gaugePos = pos('gauge-bar');
  const scoreEl = elements.find(e => e.id === 'scoreText');
  const scoreFontSize = (scoreEl?.textStyle?.fontSizePx || 90) * scale;
  const scoreStrokeW = (scoreEl?.textStyle?.strokeWidth || 6) * scale;
  const scoreStrokeColor = scoreEl?.textStyle?.strokeColor || '#000';

  return (
    <div className={styles.overlay} style={{ pointerEvents: 'none' }}>
      {/* 게이지바 */}
      {gaugePos && (
        <div style={boxStyle('gauge-bar')}>
          {/* 빈 게이지 배경 */}
          <img
            src={`${BASE}ui/gauge-empty.png`}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }}
            draggable={false}
          />
          {/* 찬 게이지 (대각선 클립 — Phaser 원본과 동일: slant = height * 0.424) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}>
            {(() => {
              const w = gaugePos.displayWidth;
              const h = gaugePos.displayHeight;
              const slant = h * 0.424; // 대각선 기울기 (113도)
              const slantPct = (slant / w) * 100;
              const fillPct = timerPct * 100;
              const bottomPct = Math.max(0, fillPct - slantPct);
              return (
                <div style={{
                  width: '100%',
                  height: '100%',
                  clipPath: `polygon(0% 0%, ${fillPct}% 0%, ${bottomPct}% 100%, 0% 100%)`,
                }}>
                  <img
                    src={`${BASE}ui/gauge-full.png`}
                    alt=""
                    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }}
                    draggable={false}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 일시정지 버튼 */}
      <div
        style={{ ...boxStyle('btn-pause'), pointerEvents: 'auto', cursor: 'pointer' }}
        onClick={handlePause}
      >
        <img
          src={`${BASE}ui/btn-pause.png`}
          alt="일시정지"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
          draggable={false}
        />
      </div>

      {/* 점수 */}
      {pos('scoreText') && (
        <div style={{
          ...boxStyle('scoreText'),
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          fontSize: scoreFontSize,
          fontWeight: 'bold',
          fontFamily: 'GMarketSans, sans-serif',
          color: scoreEl?.textStyle?.color || '#fff',
          WebkitTextStroke: `${scoreStrokeW}px ${scoreStrokeColor}`,
          paintOrder: 'stroke fill',
        }}>
          {score}
        </div>
      )}

      {/* 좌측 버튼 (방향 전환) */}
      <div
        style={{
          ...boxStyle('btn-switch'),
          pointerEvents: 'auto',
          cursor: 'pointer',
          transform: pressedBtn === 'btn-switch' ? 'scale(0.85)' : undefined,
          transition: 'transform 0.08s ease-out',
        }}
        onPointerDown={() => { handleBtnDown('btn-switch'); handleSwitch(); }}
      >
        <img
          src={`${BASE}ui/btn-switch.png`}
          alt="전환"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
          draggable={false}
        />
      </div>

      {/* 우측 버튼 (전진) */}
      <div
        style={{
          ...boxStyle('btn-forward'),
          pointerEvents: 'auto',
          cursor: 'pointer',
          transform: pressedBtn === 'btn-forward' ? 'scale(0.85)' : undefined,
          transition: 'transform 0.08s ease-out',
        }}
        onPointerDown={() => { handleBtnDown('btn-forward'); handleForward(); }}
      >
        <img
          src={`${BASE}ui/btn-forward.png`}
          alt="전진"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
          draggable={false}
        />
      </div>
      {/* 튜토리얼 가이드 */}
      {showGuide && (
        <>
          <style>{`
            @keyframes guideGlow {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.08); }
            }
            @keyframes guideArrowR {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(6px); }
            }
            @keyframes guideArrowL {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(-6px); }
            }
            @keyframes guideFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>

          {/* 우측: 전진 버튼 가이드 */}
          {pos('btn-forward') && (() => {
            const p = pos('btn-forward')!;
            const cx = p.x - p.displayWidth * p.originX + p.displayWidth / 2;
            const cy = p.y - p.displayHeight * p.originY + p.displayHeight / 2;
            const r = Math.max(p.displayWidth, p.displayHeight) / 2;
            return (
              <>
                {/* 글로우 링 */}
                <div style={{
                  position: 'absolute',
                  left: cx - r - 6,
                  top: cy - r - 6,
                  width: (r + 6) * 2,
                  height: (r + 6) * 2,
                  borderRadius: '50%',
                  border: '2px solid #00e5ff',
                  boxShadow: '0 0 12px #00e5ff, 0 0 24px #00e5ff80, inset 0 0 12px #00e5ff40',
                  animation: 'guideGlow 1.2s ease-in-out infinite, guideFadeIn 0.5s ease-out',
                }} />
                {/* 텍스트 + 화살표 */}
                <div style={{
                  position: 'absolute',
                  right: window.innerWidth - (cx - r - 12),
                  top: cy - 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  animation: 'guideFadeIn 0.5s ease-out',
                }}>
                  <span style={{
                    color: '#fff',
                    fontSize: 13 * scale,
                    fontWeight: 700,
                    fontFamily: 'GMarketSans, sans-serif',
                    textShadow: '0 0 8px #00e5ff, 0 0 16px #00e5ff40',
                    whiteSpace: 'nowrap',
                  }}>
                    앞으로 한 칸 이동
                  </span>
                  <svg width="28" height="16" viewBox="0 0 28 16" style={{ animation: 'guideArrowR 0.8s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #00e5ff)' }}>
                    <rect x="0" y="6" width="16" height="4" rx="2" fill="#00e5ff" />
                    <polygon points="16,2 28,8 16,14" fill="#00e5ff" />
                  </svg>
                </div>
              </>
            );
          })()}

          {/* 좌측: 회전 버튼 가이드 */}
          {pos('btn-switch') && (() => {
            const p = pos('btn-switch')!;
            const cx = p.x - p.displayWidth * p.originX + p.displayWidth / 2;
            const cy = p.y - p.displayHeight * p.originY + p.displayHeight / 2;
            const r = Math.max(p.displayWidth, p.displayHeight) / 2;
            return (
              <>
                {/* 글로우 링 (빨간색) */}
                <div style={{
                  position: 'absolute',
                  left: cx - r - 6,
                  top: cy - r - 6,
                  width: (r + 6) * 2,
                  height: (r + 6) * 2,
                  borderRadius: '50%',
                  border: '2px solid #ff3b3b',
                  boxShadow: '0 0 12px #ff3b3b, 0 0 24px #ff3b3b80, inset 0 0 12px #ff3b3b40',
                  animation: 'guideGlow 1.2s ease-in-out infinite, guideFadeIn 0.5s ease-out',
                }} />
                {/* 텍스트 + 화살표 */}
                <div style={{
                  position: 'absolute',
                  left: cx + r + 12,
                  top: cy - 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  animation: 'guideFadeIn 0.5s ease-out',
                }}>
                  <svg width="28" height="16" viewBox="0 0 28 16" style={{ animation: 'guideArrowL 0.8s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #ff3b3b)' }}>
                    <rect x="12" y="6" width="16" height="4" rx="2" fill="#ff3b3b" />
                    <polygon points="12,2 0,8 12,14" fill="#ff3b3b" />
                  </svg>
                  <span style={{
                    color: '#fff',
                    fontSize: 13 * scale,
                    fontWeight: 700,
                    fontFamily: 'GMarketSans, sans-serif',
                    textShadow: '0 0 8px #ff3b3b, 0 0 16px #ff3b3b40',
                    whiteSpace: 'nowrap',
                  }}>
                    회전하고 한 칸 이동
                  </span>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
