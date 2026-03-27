import { isTossNative } from '../platform';

/**
 * 애널리틱스 서비스 — 토스 환경에서만 동작, 그 외 무시
 */

export async function logEvent(name: string, params: Record<string, string | number | boolean> = {}): Promise<void> {
  if (!isTossNative()) return;
  try {
    const { eventLog } = await import('@apps-in-toss/web-framework');
    eventLog({ log_name: name, log_type: 'event', params });
  } catch { /* 무시 */ }
}

export async function logClick(name: string): Promise<void> {
  if (!isTossNative()) return;
  try {
    const { Analytics } = await import('@apps-in-toss/web-framework');
    Analytics.click({ log_name: name });
  } catch { /* 무시 */ }
}

export async function logScreen(name: string): Promise<void> {
  if (!isTossNative()) return;
  try {
    const { Analytics } = await import('@apps-in-toss/web-framework');
    Analytics.screen({ log_name: name });
  } catch { /* 무시 */ }
}
