/**
 * Cookieless Google Analytics 4.
 *
 * The tag reads and writes **nothing** on the visitor's device — no cookie, no
 * localStorage, no sessionStorage. That is what makes the site banner-free:
 * ePrivacy Art. 5(3), the rule that forces consent banners, is triggered by
 * storing or accessing information on terminal equipment, not by "analytics"
 * as such. Touch no storage and the article simply does not apply.
 *
 * Consent Mode is the only mechanism that actually achieves this. Verified
 * against the live tag on 2026-08-16:
 *
 *   - `client_storage: 'none'` is widely recommended online and **does not
 *     work**. The current Google tag does not recognise it as a config
 *     directive: it forwards it to the payload as `ep.client_storage=none`
 *     and writes `_ga` / `_ga_<id>` anyway. Same for `anonymize_ip` and
 *     `transport_type`. Do not reintroduce them.
 *   - `gtag('consent', 'default', { analytics_storage: 'denied', ... })`
 *     genuinely writes nothing — no cookie, no localStorage, no
 *     sessionStorage. Hits still go out, tagged `gcs=G100`.
 *
 * The cost is real and must not be papered over: `gcs=G100` hits are
 * cookieless pings that feed Google's behavioural modelling and do not
 * populate standard reports at low traffic volumes.
 *
 * The cost of having no storage is that `client_id` cannot persist: it is a
 * fresh UUID per page load, held in memory only. Event and pageview counts
 * stay meaningful; "users", sessions and retention do not. Persisting the id
 * anywhere — as most "cookieless GA" recipes suggest — would put the banner
 * straight back.
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

/** Visitors who ask not to be measured aren't measured — and never reach Google at all. */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

/** `crypto.randomUUID` needs a secure context; previewing over a LAN IP isn't one. */
function randomId(): string {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function initAnalytics(): void {
  try {
    setup();
  } catch {
    /* analytics must never break the page */
  }
}

function setup(): void {
  const id = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  if (!id || enabled || typeof window === 'undefined') return;
  if (optedOut()) return;

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
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
  });
  gtag('js', new Date());
  gtag('config', id, {
    // In-memory only. Never persist this — see the module comment.
    client_id: randomId(),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  enabled = true;

  window.addEventListener('error', (e) => {
    trackError('window', e.message, true);
  });
  window.addEventListener('unhandledrejection', (e) => {
    trackError('promise', String(e.reason), true);
  });
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
