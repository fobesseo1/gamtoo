/**
 * Reads an image's pixel dimensions straight out of its file header —
 * JPEG's SOF marker or PNG's IHDR chunk — without asking the browser to
 * decode a single pixel. Real phone photos (50-100+ MP) need this: knowing
 * the size up front lets the caller ask createImageBitmap to decode
 * straight to a small target size (see downscale-image.ts), instead of
 * decoding the full original into memory first and shrinking after. Only
 * the first 64KB is read — dimensions live in the first few hundred bytes
 * of any real file.
 */
export async function sniffImageDimensions(
  source: Blob,
): Promise<{ width: number; height: number } | null> {
  const head = await source.slice(0, 65536).arrayBuffer();
  if (head.byteLength < 24) return null;
  const view = new DataView(head);

  return sniffJpeg(view) ?? sniffPng(view);
}

function sniffJpeg(view: DataView): { width: number; height: number } | null {
  if (view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);

    // Markers with no payload (standalone).
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    if (offset + 4 > view.byteLength) return null;
    const length = view.getUint16(offset + 2);

    // SOF0-SOF15, excluding DHT (0xC4), JPG (0xC8), DAC (0xCC) — these carry
    // the actual frame dimensions.
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      if (offset + 9 > view.byteLength) return null;
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      return { width, height };
    }

    offset += 2 + length;
  }
  return null;
}

function sniffPng(view: DataView): { width: number; height: number } | null {
  // 8-byte signature, then a 4-byte length + "IHDR" + width(4) + height(4).
  if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) return null;
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { width, height };
}
