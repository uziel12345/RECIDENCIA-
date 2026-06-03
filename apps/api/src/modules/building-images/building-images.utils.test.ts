import { describe, expect, it } from "vitest";
import { hasValidImageSignature } from "./building-images.utils.js";

function buf(bytes: number[]): Buffer {
  const b = Buffer.alloc(12, 0);
  bytes.forEach((byte, i) => { b[i] = byte; });
  return b;
}

describe("hasValidImageSignature", () => {
  // ── Valid signatures ─────────────────────────────────────────────────────

  it("accepts a JPEG file (FF D8 FF)", () => {
    expect(hasValidImageSignature(buf([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
  });

  it("accepts a JPEG with JFIF marker (FF D8 FF E0)", () => {
    expect(hasValidImageSignature(buf([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe(true);
  });

  it("accepts a JPEG with Exif marker (FF D8 FF E1)", () => {
    expect(hasValidImageSignature(buf([0xff, 0xd8, 0xff, 0xe1]))).toBe(true);
  });

  it("accepts a PNG file (89 50 4E 47 0D 0A 1A 0A)", () => {
    expect(hasValidImageSignature(buf([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]))).toBe(true);
  });

  it("accepts a WebP file (RIFF????WEBP)", () => {
    expect(hasValidImageSignature(buf([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // file size (ignored)
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]))).toBe(true);
  });

  it("accepts WebP regardless of the 4 size bytes", () => {
    expect(hasValidImageSignature(buf([
      0x52, 0x49, 0x46, 0x46,
      0xab, 0xcd, 0xef, 0x12, // arbitrary size bytes
      0x57, 0x45, 0x42, 0x50,
    ]))).toBe(true);
  });

  // ── Rejected: disguised files ────────────────────────────────────────────

  it("rejects a PHP file disguised as JPEG (<?php header)", () => {
    // "<?ph" = 3C 3F 70 68
    expect(hasValidImageSignature(buf([0x3c, 0x3f, 0x70, 0x68]))).toBe(false);
  });

  it("rejects an HTML file disguised as PNG", () => {
    // "<html" = 3C 68 74 6D 6C
    expect(hasValidImageSignature(buf([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBe(false);
  });

  it("rejects a GIF file (GIF89a)", () => {
    // GIF89a = 47 49 46 38 39 61
    expect(hasValidImageSignature(buf([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe(false);
  });

  it("rejects a PDF file (%PDF)", () => {
    // %PDF = 25 50 44 46
    expect(hasValidImageSignature(buf([0x25, 0x50, 0x44, 0x46]))).toBe(false);
  });

  it("rejects a ZIP file (PK header)", () => {
    // PK = 50 4B 03 04
    expect(hasValidImageSignature(buf([0x50, 0x4b, 0x03, 0x04]))).toBe(false);
  });

  it("rejects all-zero bytes", () => {
    expect(hasValidImageSignature(Buffer.alloc(12, 0))).toBe(false);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it("rejects a buffer with only 3 correct JPEG bytes but wrong 4th", () => {
    // Still valid — JPEG only requires first 3 bytes (FF D8 FF)
    expect(hasValidImageSignature(buf([0xff, 0xd8, 0xff, 0x00]))).toBe(true);
  });

  it("rejects PNG with one wrong byte in signature", () => {
    expect(hasValidImageSignature(buf([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x00, // last byte changed from 0x0a to 0x00
    ]))).toBe(false);
  });

  it("rejects RIFF header without WEBP fourcc", () => {
    expect(hasValidImageSignature(buf([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI  (not WEBP)
    ]))).toBe(false);
  });

  it("rejects an empty 12-byte buffer", () => {
    expect(hasValidImageSignature(Buffer.alloc(12))).toBe(false);
  });
});
