import { usePress } from '../hooks/usePress';
import styles from '../overlays/overlay.module.css';

const BASE = import.meta.env.BASE_URL || '/';

interface Props {
  label: string;
  scale: number;
  onClick: () => void;
}

export function StartButton({ label, scale, onClick }: Props) {
  const { handlers, pressStyle } = usePress();

  return (
    <div
      className={styles.fadeInThenPulse}
      style={{ width: 214 * scale, position: 'relative' }}
    >
      <div
        onClick={onClick}
        {...handlers('start-btn', onClick)}
        style={{
          cursor: 'pointer',
          position: 'relative',
          ...pressStyle('start-btn'),
        }}
      >
        <img
          src={`${BASE}main-screen/main-btn.png`}
          alt=""
          draggable={false}
          style={{ width: '100%', display: 'block', objectFit: 'contain' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          paddingBottom: (label.includes(' ') ? 18 : 14) * scale,
          justifyContent: 'center',
          fontFamily: 'GMarketSans, sans-serif',
          fontWeight: 900,
          fontSize: 28 * scale,
          color: '#fff',
          WebkitTextStroke: `${5 * scale}px #000`,
          paintOrder: 'stroke fill',
          pointerEvents: 'none',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
