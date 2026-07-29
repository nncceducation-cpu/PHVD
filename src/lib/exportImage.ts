// Render an assessment report element to a PNG and save it to the device Photos.
// On-device only; nothing is uploaded.
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import html2canvas from 'html2canvas';

const ALBUM = 'PHVD';

export function isSaveToPhotosAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function renderPng(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

function fileName(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `PHVD_${stamp}_${Date.now()}`;
}

// Save the rendered element into the device photo library.
export async function saveElementToPhotos(el: HTMLElement): Promise<void> {
  const dataUrl = await renderPng(el);
  const name = fileName();

  if (Capacitor.getPlatform() === 'android') {
    // Android requires an album identifier — ensure a "PHVD" album exists.
    let res = await Media.getAlbums();
    let album = res.albums.find((a) => a.name === ALBUM);
    if (!album) {
      await Media.createAlbum({ name: ALBUM });
      res = await Media.getAlbums();
      album = res.albums.find((a) => a.name === ALBUM);
    }
    await Media.savePhoto({ path: dataUrl, albumIdentifier: album?.identifier, fileName: name });
  } else {
    // iOS saves to the Camera Roll (add-only permission via NSPhotoLibraryAddUsageDescription).
    await Media.savePhoto({ path: dataUrl, fileName: name });
  }
}

// Web fallback: download the PNG.
export async function downloadElementAsPng(el: HTMLElement): Promise<void> {
  const dataUrl = await renderPng(el);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileName()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
