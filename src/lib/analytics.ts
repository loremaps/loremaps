/**
 * Google Analytics 4 consent updates and app events.
 *
 * The page layout bootstraps Advanced Consent Mode before client code runs.
 * This module only updates that initial state after a visitor chooses whether
 * analytics cookies may be used. Ad storage, Google Signals and ad
 * personalisation remain disabled in every state.
 */

type GtagParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 rejects longer names/values outright, so clamp rather than lose the event. */
const MAX_EVENT_NAME = 40;
const MAX_PARAM_VALUE = 100;

let enabled = false;
let errorListenersAttached = false;

const deniedConsent = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
} as const;

const grantedAnalyticsConsent = {
  ...deniedConsent,
  analytics_storage: 'granted',
} as const;

/** Visitors who ask not to be measured aren't measured — and never reach Google at all. */
function optedOut(): boolean {
  if (typeof navigator === 'undefined') return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

function updateConsent(consent: typeof deniedConsent | typeof grantedAnalyticsConsent): boolean {
  if (typeof window === 'undefined' || optedOut() || !window.gtag) return false;
  window.gtag('consent', 'update', consent);
  return true;
}

/** Grant analytics storage after an explicit analytics-consent choice. */
export function enableAnalytics(): boolean {
  try {
    if (!updateConsent(grantedAnalyticsConsent)) return false;
    enabled = true;
    attachErrorListeners();
    return true;
  } catch {
    /* analytics must never break the page */
    return false;
  }
}

function attachErrorListeners(): void {
  if (!errorListenersAttached) {
    window.addEventListener('error', (e) => {
      trackError('window', e.message, true);
    });
    window.addEventListener('unhandledrejection', (e) => {
      trackError('promise', String(e.reason), true);
    });
    errorListenersAttached = true;
  }
}

/** Deny analytics storage immediately; the consent UI clears cookies and reloads. */
export function disableAnalytics(): void {
  enabled = false;
  try {
    updateConsent(deniedConsent);
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Send one GA4 event. Never throws and never blocks: analytics is not allowed
 * to take the map down with it, so a missing or blocked gtag is a silent no-op.
 */
export function track(name: string, params: GtagParams = {}): void {
  if (!enabled) return;
  try {
    const clamped: GtagParams = {};
    for (const [key, value] of Object.entries(params)) {
      clamped[key] = typeof value === 'string' ? value.slice(0, MAX_PARAM_VALUE) : value;
    }
    window.gtag?.('event', name.slice(0, MAX_EVENT_NAME), clamped);
  } catch {
    /* analytics must never break the page */
  }
}

export function trackError(source: string, message: string, fatal: boolean): void {
  track('app_error', { error_source: source, error_message: message, fatal });
}
