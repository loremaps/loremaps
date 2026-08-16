/**
 * Consent-gated Google Analytics 4.
 *
 * Basic consent mode is deliberate: this module is not enabled and gtag.js is
 * not requested until the visitor accepts analytics cookies. Once accepted,
 * GA manages its normal first-party client and session cookies. Ad storage,
 * Google Signals and ad personalisation remain disabled.
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

/** Visitors who ask not to be measured aren't measured — and never reach Google at all. */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

/** Enable GA after an explicit analytics-consent choice. */
export function enableAnalytics(): boolean {
  try {
    return setup();
  } catch {
    /* analytics must never break the page */
    return false;
  }
}

function setup(): boolean {
  const id = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  if (!import.meta.env.PROD || !id || typeof window === 'undefined') return false;
  if (enabled) return true;
  if (optedOut()) return false;

  const dataLayer = (window.dataLayer ??= []);
  // gtag.js identifies its own commands by the pushed value being an `Arguments`
  // object — pushing a plain array instead is silently ignored. Hence the
  // non-arrow function and `arguments`, exactly as in Google's own snippet.
  function gtag(..._args: unknown[]): void {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
  });
  gtag('js', new Date());
  gtag('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  if (!document.querySelector('script[data-loremaps-analytics]')) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.loremapsAnalytics = '';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  enabled = true;

  if (!errorListenersAttached) {
    window.addEventListener('error', (e) => {
      trackError('window', e.message, true);
    });
    window.addEventListener('unhandledrejection', (e) => {
      trackError('promise', String(e.reason), true);
    });
    errorListenersAttached = true;
  }

  return true;
}

/** Stop app events immediately; the consent UI clears cookies and reloads. */
export function disableAnalytics(): void {
  enabled = false;
  try {
    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
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
