import { useState, useCallback } from 'react';
import { gameBus } from '../../game/event-bus';
import { storage } from '../../game/services/storage';
import { DESIGN_W } from '../../game/layout-types';
import { usePress } from '../hooks/usePress';
import { getRandomChallengeQuote } from '../../game/challenge-quotes';
import styles from './overlay.module.css';

const MAX_W = 500;
const scale = Math.min(window.innerWidth, MAX_W) / DESIGN_W;
const BASE = import.meta.env.BASE_URL || '/';

interface Props {
  score: number;
  onClose: () => void;
}

export function ChallengeOverlay({ score, onClose }: Props) {
  const bestScore = storage.getBestScore();
  const isNewRecord = score >= bestScore && bestScore > 0;
  const [message, setMessage] = useState(() => getRandomChallengeQuote(score, isNewRecord));
  const { handlers, pressStyle } = usePress();

  const handleRefresh = useCallback(() => {
    gameBus.emit('play-sfx', 'sfx-click');
    setMessage(getRandomChallengeQuote(score, isNewRecord));
  }, [score, isNewRecord]);

  const handleCTA = useCallback(async () => {
    gameBus.emit('play-sfx', 'sfx-click');
    const shareText = `${message}\n\n🎮 직장인 잔혹사 : 퇴근길\nhttps://play.google.com/store/apps/details?id=com.dragonnine.game01`;
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: '직장인 잔혹사 : 퇴근길',
        text: shareText,
        dialogTitle: '도전장 보내기',
      });
    } catch {
      // 공유 취소 또는 미지원 — 무시
    }
  }, [message]);

  const handleClose = useCallback(() => {
    gameBus.emit('play-sfx', 'sfx-click');
    onClose();
  }, [onClose]);

  return (
    <div
      className={`${styles.overlay} ${styles.fadeIn}`}
      style={{ zIndex: 200 }}
      onClick={handleClose}
    >
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
            maxWidth: 360 * scale,
            position: 'relative',
          }}
        >
          {/* X 버튼 */}
          <div
            onClick={handleClose}
            {...handlers('challenge-close')}
            style={{
              position: 'absolute',
              top: 12 * scale, right: 12 * scale,
              width: 28 * scale, height: 28 * scale,
              borderRadius: 999,
              background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              ...pressStyle('challenge-close'),
            }}
          >
            <span style={{ color: '#fff', fontSize: 14 * scale, fontWeight: 700, lineHeight: 1 }}>✕</span>
          </div>

          {/* 점수 */}
          <div style={{
            fontFamily: 'GMarketSans, sans-serif',
            fontWeight: 900,
            fontSize: 48 * scale,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 8 * scale,
          }}>
            {score}
          </div>

          {/* 캐릭터 이미지 */}
          <div style={{ textAlign: 'center', marginBottom: 12 * scale }}>
            <img
              src={`${BASE}challenge/challenge-rabbit.png`}
              alt=""
              draggable={false}
              style={{ width: 140 * scale, objectFit: 'contain' }}
            />
          </div>

          {/* 멘트 카드 */}
          <div style={{
            background: '#1a1a1f',
            borderRadius: 14 * scale,
            padding: `${14 * scale}px ${16 * scale}px`,
            marginBottom: 10 * scale,
            textAlign: 'center',
          }}>
            <span style={{
              fontFamily: 'GMarketSans, sans-serif',
              fontWeight: 400,
              fontSize: 14 * scale,
              color: '#ccc',
              lineHeight: 1.5,
            }}>
              {message}
            </span>
          </div>

          {/* 다른 멘트로 바꾸기 */}
          <div
            onClick={handleRefresh}
            {...handlers('challenge-refresh')}
            style={{
              textAlign: 'center',
              marginBottom: 20 * scale,
              cursor: 'pointer',
              ...pressStyle('challenge-refresh'),
            }}
          >
            <span style={{
              fontFamily: 'GMarketSans, sans-serif',
              fontWeight: 400,
              fontSize: 12 * scale,
              color: '#888',
            }}>
              ↻ 다른 멘트로 바꾸기
            </span>
          </div>

          {/* 카카오톡 보내기 버튼 */}
          <div
            onClick={handleCTA}
            {...handlers('challenge-cta')}
            style={{
              background: '#000',
              borderRadius: 12 * scale,
              padding: `${14 * scale}px`,
              textAlign: 'center',
              cursor: 'pointer',
              ...pressStyle('challenge-cta'),
            }}
          >
            <span style={{
              fontFamily: 'GMarketSans, sans-serif',
              fontWeight: 700,
              fontSize: 20 * scale,
              color: '#fff',
            }}>
              도전장 보내기
            </span>
          </div>
        </div>

        {/* 안내 텍스트 */}
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
