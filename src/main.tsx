import { createRoot } from 'react-dom/client'
import './index.css'

const RECOVERY_PARAM_BACKUP = 'passwordRecoveryParamsBackup';

const captureRecoveryLinkParams = () => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const keys = ['code', 'token_hash', 'access_token', 'refresh_token', 'type', 'error', 'error_description'];
  const captured = keys.reduce<Record<string, string>>((params, key) => {
    const value = url.searchParams.get(key) || hashParams.get(key);
    if (value) params[key] = value;
    return params;
  }, {});

  const hasRecoveryData = Boolean(
    captured.code ||
    captured.token_hash ||
    captured.access_token ||
    captured.refresh_token ||
    captured.type === 'recovery' ||
    captured.error
  );

  if (hasRecoveryData) {
    sessionStorage.setItem(RECOVERY_PARAM_BACKUP, JSON.stringify({ ...captured, capturedAt: Date.now() }));
  }
};

captureRecoveryLinkParams();

import('./App.tsx').then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(<App />);
});
