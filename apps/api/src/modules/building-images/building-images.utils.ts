/**
 * Verifies the first bytes of a buffer match a known image format signature.
 * Rejects files where the extension/MIME was spoofed (e.g. a PHP file renamed to .jpg).
 */
export function hasValidImageSignature(buf: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return true;

  // WebP: RIFF????WEBP (bytes 0-3 and 8-11)
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;

  return false;
}
