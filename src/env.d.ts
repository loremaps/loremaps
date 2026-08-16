interface ImportMetaEnv {
  /**
   * GA4 measurement ID (`G-XXXXXXXXXX`). Leave unset to disable analytics
   * entirely — `initAnalytics()` becomes a no-op and nothing is sent.
   */
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
