import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

// In-memory cache for base64 font data
let regularFontBase64Cache: string | null = null;
let boldFontBase64Cache: string | null = null;

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Fetch font binary from local or CDN fallback and return base64
 */
async function fetchFontAsBase64(localPath: string, fallbackUrl: string): Promise<string> {
  try {
    const res = await fetch(localPath);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return arrayBufferToBase64(buffer);
    }
  } catch {
    // Continue to fallback
  }

  try {
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return arrayBufferToBase64(buffer);
    }
  } catch {
    // Both failed
  }

  throw new Error(`Failed to load font from ${localPath} and ${fallbackUrl}`);
}

/**
 * Ensure Noto Sans Devanagari fonts are loaded into jsPDF virtual file system
 */
export async function ensureDevanagariFontsLoaded(doc: jsPDF): Promise<boolean> {
  try {
    if (!regularFontBase64Cache) {
      regularFontBase64Cache = await fetchFontAsBase64(
        '/fonts/NotoSansDevanagari-Regular.ttf',
        'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf'
      );
    }

    if (!boldFontBase64Cache) {
      boldFontBase64Cache = await fetchFontAsBase64(
        '/fonts/NotoSansDevanagari-Bold.ttf',
        'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf'
      );
    }

    // Register into jsPDF VFS
    doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', regularFontBase64Cache);
    doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');

    doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', boldFontBase64Cache);
    doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');

    doc.setFont('NotoSansDevanagari', 'normal');
    return true;
  } catch (error) {
    console.warn('Warning: Could not embed Devanagari TTF font in jsPDF:', error);
    return false;
  }
}

export { autoTable };
