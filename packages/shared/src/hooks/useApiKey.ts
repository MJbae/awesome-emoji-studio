import { useAppStore } from '@/store/appStore';

export function useApiKey() {
  const apiKey = useAppStore((s) => s.apiKey);
  const keyHydrated = useAppStore((s) => s.keyHydrated);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const clearApiKey = useAppStore((s) => s.clearApiKey);
  const setApiKeyAsync = useAppStore((s) => s.setApiKeyAsync);
  const clearApiKeyAsync = useAppStore((s) => s.clearApiKeyAsync);

  return {
    apiKey,
    keyHydrated,
    isConfigured: apiKey !== null && apiKey.length > 0,
    setApiKey,
    clearApiKey,
    setApiKeyAsync,
    clearApiKeyAsync,
  };
}
