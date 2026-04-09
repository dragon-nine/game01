/**
 * 인앱 결제 서비스 — Google Play Billing + 토스 IAP 분기
 */

import { registerPlugin } from '@capacitor/core';
import { isGoogle, isToss, isTossNative } from '../platform';
import { gameConfig } from '../game.config';

// ── Google Play Billing ──

interface BillingPlugin {
  purchase(options: { productId: string }): Promise<{ purchased: boolean }>;
  restorePurchases(): Promise<{ adRemoved: boolean }>;
}

const Billing = registerPlugin<BillingPlugin>('Billing');

const AD_REMOVE_KEY = 'ad_removed';

/** 광고 제거 구매 여부 (로컬 캐시) */
export function isAdRemoved(): boolean {
  return localStorage.getItem(AD_REMOVE_KEY) === 'true';
}

// ── Google Play 결제 ──

async function purchaseGoogle(): Promise<boolean> {
  try {
    const result = await Billing.purchase({ productId: 'ad_remove' });
    if (result.purchased) {
      localStorage.setItem(AD_REMOVE_KEY, 'true');
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Billing] Google 구매 실패:', e);
    return false;
  }
}

async function restoreGoogle(): Promise<boolean> {
  try {
    const result = await Billing.restorePurchases();
    if (result.adRemoved) {
      localStorage.setItem(AD_REMOVE_KEY, 'true');
    }
    return result.adRemoved;
  } catch (e) {
    console.error('[Billing] Google 복원 실패:', e);
    return false;
  }
}

// ── 토스 IAP ──

function getTossSku(): string {
  const sku = gameConfig.tossIapSku;
  if (!sku || sku.startsWith('TODO')) {
    console.warn('[Billing] 토스 IAP SKU가 설정되지 않았습니다');
    return '';
  }
  return sku;
}

async function purchaseToss(): Promise<boolean> {
  const sku = getTossSku();
  if (!sku) return false;

  try {
    const { IAP } = await import('@apps-in-toss/web-framework');

    return new Promise<boolean>((resolve) => {
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: () => {
            // 상품 지급 처리 — 로컬 스토리지에 저장
            localStorage.setItem(AD_REMOVE_KEY, 'true');
            return true;
          },
        },
        onEvent: () => {
          cleanup();
          resolve(true);
        },
        onError: (error) => {
          console.error('[Billing] 토스 구매 실패:', error);
          cleanup();
          resolve(false);
        },
      });
    });
  } catch (e) {
    console.error('[Billing] 토스 IAP 호출 실패:', e);
    return false;
  }
}

async function restoreToss(): Promise<boolean> {
  try {
    const { IAP } = await import('@apps-in-toss/web-framework');
    const result = await IAP.getCompletedOrRefundedOrders();
    if (!result?.orders) return false;

    const sku = getTossSku();
    // COMPLETED 상태인 ad_remove 구매가 있으면 복원
    const purchased = result.orders.some(
      (o) => o.sku === sku && o.status === 'COMPLETED'
    );

    if (purchased) {
      localStorage.setItem(AD_REMOVE_KEY, 'true');
    } else {
      // 환불된 경우 제거
      localStorage.removeItem(AD_REMOVE_KEY);
    }
    return purchased;
  } catch (e) {
    console.error('[Billing] 토스 복원 실패:', e);
    return false;
  }
}

/** 미완료 주문 처리 (결제 완료 but 상품 미지급) */
async function processPendingToss(): Promise<void> {
  try {
    const { IAP } = await import('@apps-in-toss/web-framework');
    const pending = await IAP.getPendingOrders();
    if (!pending?.orders?.length) return;

    for (const order of pending.orders) {
      await IAP.completeProductGrant({ params: { orderId: order.orderId } });
      localStorage.setItem(AD_REMOVE_KEY, 'true');
    }
  } catch (e) {
    console.warn('[Billing] 미완료 주문 처리 실패:', e);
  }
}

// ── 공개 API ──

/** 광고 제거 구매 */
export async function purchaseAdRemove(): Promise<boolean> {
  if (isGoogle()) return purchaseGoogle();
  if (isToss() && isTossNative()) return purchaseToss();

  console.warn('[Billing] 지원하지 않는 플랫폼');
  return false;
}

/** 구매 복원 (앱 시작 시) */
export async function restoreAdRemove(): Promise<boolean> {
  if (isGoogle()) return restoreGoogle();
  if (isToss() && isTossNative()) {
    await processPendingToss();
    return restoreToss();
  }
  return false;
}

/** 토스 상품 가격 조회 */
export async function getTossProductPrice(): Promise<string | null> {
  if (!isToss()) return null;
  try {
    const { IAP } = await import('@apps-in-toss/web-framework');
    const result = await IAP.getProductItemList();
    const sku = getTossSku();
    const product = result?.products?.find((p) => p.sku === sku);
    return product?.displayAmount ?? null;
  } catch {
    return null;
  }
}
