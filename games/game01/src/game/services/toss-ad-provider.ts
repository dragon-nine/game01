/**
 * 토스 리워드 광고 프로바이더
 *
 * 토스 인앱 광고 2.0 ver2 — load → show 패턴
 * 테스트용 adGroupId: 'ait-ad-test-rewarded-id'
 */

import type { AdProvider } from './ad-service';
import { gameConfig } from '../game.config';

const TEST_AD_GROUP_ID = 'ait-ad-test-rewarded-id';
const isDev = import.meta.env.DEV;

export class TossAdProvider implements AdProvider {
  private loaded = false;

  private getAdGroupId(): string {
    const id = gameConfig.tossAdGroupId;
    if (isDev || !id || id.startsWith('TODO')) {
      return TEST_AD_GROUP_ID;
    }
    return id;
  }

  async preload(): Promise<void> {
    const { loadFullScreenAd } = await import('@apps-in-toss/web-framework');

    return new Promise<void>((resolve) => {
      loadFullScreenAd({
        options: { adGroupId: this.getAdGroupId() },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            this.loaded = true;
            resolve();
          }
        },
        onError: (error) => {
          console.warn('[TossAd] 광고 로드 실패:', error);
          this.loaded = false;
          resolve(); // 실패해도 resolve (showRewarded에서 fallback 처리)
        },
      });
    });
  }

  async showRewarded(): Promise<void> {
    // 로드 안 됐으면 먼저 로드 시도
    if (!this.loaded) {
      await this.preload();
    }
    if (!this.loaded) {
      throw new Error('Ad not loaded');
    }

    const { showFullScreenAd } = await import('@apps-in-toss/web-framework');

    return new Promise<void>((resolve, reject) => {
      let rewarded = false;
      let settled = false;

      showFullScreenAd({
        options: { adGroupId: this.getAdGroupId() },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') {
            rewarded = true;
          } else if (event.type === 'dismissed') {
            if (settled) return;
            settled = true;
            this.loaded = false;
            // 다음 광고 미리 로드
            this.preload();
            if (rewarded) {
              resolve();
            } else {
              reject(new Error('Ad dismissed without reward'));
            }
          } else if (event.type === 'failedToShow') {
            if (settled) return;
            settled = true;
            this.loaded = false;
            reject(new Error('Ad failed to show'));
          }
        },
        onError: (error) => {
          if (settled) return;
          settled = true;
          this.loaded = false;
          console.warn('[TossAd] 광고 표시 실패:', error);
          reject(error);
        },
      });
    });
  }

  isReady(): boolean {
    return this.loaded;
  }
}
