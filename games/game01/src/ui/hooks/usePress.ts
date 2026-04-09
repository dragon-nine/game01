import { useCallback, useRef, useState } from 'react';

/**
 * 모바일 WebView에서 버튼 터치 피드백 제공
 * - onTouchStart/End로 즉각적인 scale 피드백
 * - onTouchEnd에서 즉시 콜백 실행 (onClick 딜레이 회피)
 */
export function usePress() {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const movedRef = useRef(false);

  const handlers = useCallback((id: string, onTap?: () => void) => ({
    onTouchStart: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      movedRef.current = false;
      setPressedId(id);
    },
    onTouchMove: () => {
      movedRef.current = true;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      timerRef.current = setTimeout(() => setPressedId(null), 100);
      if (onTap && !movedRef.current) {
        e.preventDefault(); // onClick 중복 방지
        onTap();
      }
    },
    onTouchCancel: () => {
      setPressedId(null);
    },
  }), []);

  const pressStyle = useCallback((id: string): React.CSSProperties => ({
    transform: pressedId === id ? 'scale(0.92)' : undefined,
    transition: 'transform 0.08s ease-out',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }), [pressedId]);

  return { handlers, pressStyle, pressedId };
}
