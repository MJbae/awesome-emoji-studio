export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.desktop;
}

export const platform = {
  async getApiKey(): Promise<string | null> {
    if (isElectron()) {
      return window.desktop!.secure.getApiKey();
    }
    return localStorage.getItem('emoticon_studio_api_key');
  },

  async setApiKey(key: string): Promise<void> {
    if (isElectron()) {
      await window.desktop!.secure.setApiKey({ key });
    } else {
      localStorage.setItem('emoticon_studio_api_key', key);
    }
  },

  async deleteApiKey(): Promise<void> {
    if (isElectron()) {
      await window.desktop!.secure.deleteApiKey();
    } else {
      localStorage.removeItem('emoticon_studio_api_key');
    }
  },

  async saveFile(data: Uint8Array, defaultName: string): Promise<boolean> {
    if (isElectron()) {
      const result = await window.desktop!.file.saveBinary({
        data,
        defaultName,
        mimeType: 'application/zip',
      });
      return !result.canceled;
    }
    const blob = new Blob([data], { type: 'application/zip' });
    const file = new File([blob], defaultName, { type: 'application/zip' });

    // 1) Web Share API — works in most mobile browsers including in-app WebViews
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: defaultName });
        return true;
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // 2) Classic download — append to DOM, delay revoke for mobile browsers
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Delay cleanup so mobile browsers can start the download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 3000);
    return true;
  },
};
