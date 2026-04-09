/**
 * 광고 서비스 — 보상형 광고 통합 인터페이스
 *
 * 사용 패턴:
 *   1. 게임 시작 시 adService.preload()
 *   2. 부활 버튼 클릭 시 adService.showRewarded(onReward)
 *   3. 광고 미로드 시 로딩 대기 후 표시, 실패 시 house ad fallback
 */

import { logEvent } from './analytics';
import { isAdRemoved } from './billing';

export interface AdProvider {
  preload(): Promise<void>;
  showRewarded(): Promise<void>;
  isReady(): boolean;
}

type HouseAdRenderer = (onComplete: () => void) => void;

class AdService {
  private provider: AdProvider | null = null;
  private houseAdRenderer: HouseAdRenderer | null = null;
  private preloadPromise: Promise<void> | null = null;

  setProvider(provider: AdProvider) {
    this.provider = provider;
  }

  setHouseAdRenderer(renderer: HouseAdRenderer) {
    this.houseAdRenderer = renderer;
  }

  /** 광고 미리 로드 */
  preload() {
    if (!this.provider) return;
    if (this.provider.isReady()) return;
    this.preloadPromise = this.provider.preload().catch(() => {
      // 로드 실패 — showRewarded에서 처리
    });
  }

  /**
   * 보상형 광고 표시
   * 미로드 시 로드 완료까지 대기 (최대 5초), 실패 시 house ad fallback
   */
  showRewarded(onReward: () => void) {
    if (isAdRemoved()) {
      onReward();
      return;
    }

    if (this.provider?.isReady()) {
      this.showProvider(onReward);
      return;
    }

    // 광고 미로드 → 로드 대기
    if (this.provider) {
      this.preload();
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Ad load timeout')), 5000)
      );
      Promise.race([this.preloadPromise ?? Promise.reject(), timeout])
        .then(() => {
          if (this.provider?.isReady()) {
            this.showProvider(onReward);
          } else {
            logEvent('ad_fallback_house', { reason: 'not_ready_after_wait' });
            this.showHouseAd(onReward);
          }
        })
        .catch(() => {
          logEvent('ad_fallback_house', { reason: 'load_failed' });
          this.showHouseAd(onReward);
        });
      return;
    }

    logEvent('ad_fallback_house', { reason: 'no_provider' });
    this.showHouseAd(onReward);
  }

  private showProvider(onReward: () => void) {
    logEvent('ad_rewarded_show', { provider: 'rewarded' });
    this.provider!.showRewarded()
      .then(() => {
        logEvent('ad_rewarded_complete', { provider: 'rewarded' });
        onReward();
      })
      .catch(() => {
        logEvent('ad_rewarded_fail', { provider: 'rewarded' });
        this.showHouseAd(onReward);
      });
    this.preload();
  }

  private showHouseAd(onReward: () => void) {
    if (this.houseAdRenderer) {
      this.houseAdRenderer(onReward);
    } else {
      onReward();
    }
  }
}

export const adService = new AdService();
