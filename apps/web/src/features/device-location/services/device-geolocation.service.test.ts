import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pluginMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: pluginMocks.isNativePlatform },
}));

vi.mock("@capacitor/geolocation", () => ({
  Geolocation: {
    checkPermissions: pluginMocks.checkPermissions,
    requestPermissions: pluginMocks.requestPermissions,
    watchPosition: pluginMocks.watchPosition,
    clearWatch: pluginMocks.clearWatch,
  },
}));

import {
  checkDeviceLocationPermission,
  requestDeviceLocationPermission,
  translateDeviceLocationError,
} from "./device-geolocation.service";

describe("device geolocation web permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pluginMocks.isNativePlatform.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses a real browser location request instead of Capacitor requestPermissions", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({} as GeolocationPosition);
    });
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition },
      permissions: { query: vi.fn() },
    });

    await expect(requestDeviceLocationPermission()).resolves.toBe("granted");

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 15_000 }),
    );
    expect(pluginMocks.requestPermissions).not.toHaveBeenCalled();
  });

  it("returns denied when the browser rejects the permission prompt", async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "User denied Geolocation" } as GeolocationPositionError);
      },
    );
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition },
      permissions: { query: vi.fn() },
    });

    await expect(requestDeviceLocationPermission()).resolves.toBe("denied");
  });

  it("falls back to prompt when Permissions API is unavailable", async () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: vi.fn() },
    });

    await expect(checkDeviceLocationPermission()).resolves.toBe("prompt");
  });

  it("keeps the native Capacitor permission flow on Android and iOS", async () => {
    pluginMocks.isNativePlatform.mockReturnValue(true);
    pluginMocks.requestPermissions.mockResolvedValue({ location: "granted" });
    vi.stubGlobal("navigator", {});

    await expect(requestDeviceLocationPermission()).resolves.toBe("granted");
    expect(pluginMocks.requestPermissions).toHaveBeenCalledOnce();
  });

  it("provides actionable messages for browser location failures", () => {
    expect(translateDeviceLocationError({ code: 2 })).toContain("Activa");
    expect(translateDeviceLocationError({ code: 3 })).toContain("Wi-Fi");
    expect(
      translateDeviceLocationError({ message: "Only secure origins are allowed" }),
    ).toContain("HTTPS");
  });
});
