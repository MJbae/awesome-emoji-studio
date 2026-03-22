export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const data = base64.includes(',') ? base64.split(',')[1]! : base64;
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function extractBase64Data(dataUrl: string): string {
  return dataUrl.replace(/^data:.+;base64,/, '');
}

export function isBase64DataUrl(value: string): boolean {
  return /^data:.+;base64,/.test(value);
}
