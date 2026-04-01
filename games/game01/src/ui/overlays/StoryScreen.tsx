import { gameBus } from '../../game/event-bus';
import { StartButton } from '../components/StartButton';
import styles from './overlay.module.css';

const BASE = import.meta.env.BASE_URL || '/';
const DESIGN_W = 390;

export function StoryScreen() {
  const scale = Math.min(window.innerWidth, 500) / DESIGN_W;

  const handleTap = () => {
    gameBus.emit('play-sfx', 'sfx-click');
    gameBus.emit('start-game', undefined);
  };

  return (
    <div className={styles.overlay} style={{ background: '#000' }}>
      <div
        className={styles.fadeIn}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={`${BASE}story/story.png`}
          alt="story"
          draggable={false}
          style={{
            width: '100%',
            maxHeight: '75%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* 하단 버튼 — 홈 화면과 동일 위치 */}
      <div
        style={{
          position: 'absolute',
          bottom: 80 * scale,
          left: 0, right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StartButton label="퇴근 시작" scale={scale} onClick={handleTap} />
      </div>
    </div>
  );
}
