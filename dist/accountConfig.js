// Public configuration only. No database/service-role keys belong in the browser.
export const ACCOUNT_CONFIG = Object.freeze({
  endpoint: '', // https://YOUR_PROJECT.supabase.co/functions/v1/ridge-account
  requestTimeoutMs: 12000,
  syncDelayMs: 5000,
});
