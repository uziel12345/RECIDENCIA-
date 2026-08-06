import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import sharp from "sharp";
import { sanitizeUploadedImage } from "./building-images.security.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

async function temporaryFile(name: string): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "mapa-ito-image-"));
  temporaryDirectories.push(directory);
  return path.join(directory, name);
}

describe("sanitizeUploadedImage", () => {
  it("decodes and rewrites a valid image", async () => {
    const filePath = await temporaryFile("image.png");
    await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
      .png()
      .toFile(filePath);

    await sanitizeUploadedImage(filePath, "image/png");

    await expect(fs.stat(filePath)).resolves.toEqual(expect.objectContaining({ size: expect.any(Number) }));
    await expect(sharp(filePath).metadata()).resolves.toEqual(
      expect.objectContaining({ format: "png", width: 2, height: 2 })
    );
  });

  it("rejects content that does not match its declared MIME type", async () => {
    const filePath = await temporaryFile("image.jpg");
    await sharp({ create: { width: 2, height: 2, channels: 3, background: "blue" } })
      .png()
      .toFile(filePath);

    await expect(sanitizeUploadedImage(filePath, "image/jpeg")).rejects.toThrow(
      "no coincide"
    );
  });
});
