import { useCallback, useRef } from 'react';

/**
 * 모든 입력 장치(터치/마우스/펜)에서 단 한 번만 onTap을 발사하는 훅.
 *
 * Pointer Events API를 사용해 touch/mouse/click 이벤트의 중복 발사를 구조적으로 제거.
 * - `pointerdown`이 터치/마우스/펜을 하나의 스트림으로 통합
 * - `click`은 키보드(Enter/Space) 접근성용 폴백
 * - 합성 이벤트로 인한 2중 발사는 `DEDUP_WINDOW_MS` 시간창 내에서 억제
 *
 * 모든 타임스탬프는 `performance.now()`로 통일 — 브라우저 간 `Event.timeStamp`
 * 기준시 불일치(UNIX epoch vs DOMHighResTimeStamp)로 인한 억제 실패를 방지.
 *
 * 사용:
 *   const tapRef = useNativeTap(() => { ... });
 *   return <div ref={tapRef}>...</div>;
 */
interface Options {
  /**
   * 스크롤 가능한 컨테이너(상점, 리스트 등) 안의 버튼이면 true.
   * - `pointerup`에서 발사 + 이동 거리 검사 → 스크롤과 탭 구분
   * - 게임 인풋(즉시 반응 필요)에는 사용 X (기본값 false로 `pointerdown`에서 즉시 발사)
   */
  scrollSafe?: boolean;
}

const SCROLL_THRESHOLD_PX = 8;
const DEDUP_WINDOW_MS = 500;

export function useNativeTap(onTap: () => void, options: Options = {}) {
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const scrollSafe = options.scrollSafe ?? false;

  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback((el: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!el) return;
    cleanupRef.current = attachTap(el, () => onTapRef.current(), scrollSafe);
  }, [scrollSafe]);
}

function attachTap(el: HTMLElement, onTap: () => void, scrollSafe: boolean): () => void {
  // 단일 타임스탬프 기준으로 중복 억제 — 어떤 이벤트 경로로 들어오든 창 안에서는 1회만 발사.
  let lastFireAt = -Infinity;
  const fire = () => {
    const now = performance.now();
    if (now - lastFireAt < DEDUP_WINDOW_MS) return;
    lastFireAt = now;
    onTap();
  };

  // 키보드(Enter/Space) 및 합성 click 폴백. 최근 pointer 이벤트로 이미 발사됐다면 dedup.
  const onClick = () => fire();

  if (scrollSafe) {
    let startX = 0;
    let startY = 0;
    let moved = false;
    let tracking = false;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      tracking = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!tracking || moved) return;
      if (
        Math.abs(e.clientX - startX) > SCROLL_THRESHOLD_PX ||
        Math.abs(e.clientY - startY) > SCROLL_THRESHOLD_PX
      ) {
        moved = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      if (moved) return;
      fire();
      // 터치의 경우 후속 합성 click을 막아 dedup 부담을 줄임 (안드로이드 WebView 대비)
      if (e.pointerType === 'touch') e.preventDefault();
    };

    const onPointerCancel = () => {
      tracking = false;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
      el.removeEventListener('click', onClick);
    };
  }

  // 기본 모드 (게임 인풋): pointerdown에서 즉시 발사 — 최저 지연.
  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    fire();
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('click', onClick);

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('click', onClick);
  };
}
