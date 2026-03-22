import { useEffect } from 'react';
import { mountWindowApi, unmountWindowApi } from '@/bridge/windowApi';
import { startDomSync, stopDomSync } from '@/bridge/domState';

export function useExposeApi(): void {
  useEffect(() => {
    mountWindowApi();
    startDomSync();

    return () => {
      unmountWindowApi();
      stopDomSync();
    };
  }, []);
}
