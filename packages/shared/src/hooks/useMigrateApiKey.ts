import { useEffect } from 'react';
import { isElectron } from '../platform/adapter';
import { useAppStore } from '../store/appStore';

export function useMigrateApiKey(): void {
  useEffect(() => {
    if (!isElectron()) return;

    const legacyKey = localStorage.getItem('emoticon_studio_api_key');
    if (legacyKey) {
      useAppStore
        .getState()
        .setApiKeyAsync(legacyKey)
        .then(() => {
          localStorage.removeItem('emoticon_studio_api_key');
          const stored = localStorage.getItem('emoticon-studio-config');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              delete parsed.state?.apiKey;
              localStorage.setItem('emoticon-studio-config', JSON.stringify(parsed));
            } catch {
              /* ignore parse errors */
            }
          }
          console.log('[Migration] API Key migrated to secure storage');
        });
    }
  }, []);
}
