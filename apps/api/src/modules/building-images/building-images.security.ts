import fs from "node:fs/promises";
import sharp from "sharp";

const MAX_PIXELS = 40_000_000;

export async function sanitizeUploadedImage(filePath: string, mimeType: string): Promise<void> {
  const image = sharp(filePath, { limitInputPixels: MAX_PIXELS, animated: false });
  const metadata = await image.metadata();
  const mimeToFormat: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (
    metadata.format !== mimeToFormat[mimeType] ||
    width < 1 ||
    height < 1 ||
    width > 12_000 ||
    height > 12_000 ||
    width * height > MAX_PIXELS ||
    (metadata.pages ?? 1) !== 1
  ) {
    throw new Error("La imagen no coincide con el formato declarado");
  }

  const temporaryPath = `${filePath}.sanitized`;
  let pipeline = image.rotate();
  if (metadata.format === "jpeg") pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
  if (metadata.format === "png") pipeline = pipeline.png({ compressionLevel: 9 });
  if (metadata.format === "webp") pipeline = pipeline.webp({ quality: 85 });

  try {
    await pipeline.toFile(temporaryPath);
    await fs.unlink(filePath);
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}
