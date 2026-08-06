import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getMeApi: vi.fn(),
  loginAdminApi: vi.fn(),
  logoutAdminApi: vi.fn(),
}));

vi.mock("@ito-map/shared", () => apiMocks);

import { useAdminAuthStore } from "./admin-auth-store";

const adminUser = {
  id: "admin-1",
  username: "admin",
  full_name: "Administrador",
  email: "admin@example.test",
  role: "admin" as const,
  is_active: true,
};

describe("admin auth session checks", () => {
  beforeEach(() => {
    apiMocks.getMeApi.mockReset();
    useAdminAuthStore.setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not request /auth/me when no session cookie hint exists", async () => {
    vi.stubGlobal("document", { cookie: "" });

    await expect(useAdminAuthStore.getState().loadSession()).resolves.toBe(false);

    expect(apiMocks.getMeApi).not.toHaveBeenCalled();
  });

  it("deduplicates simultaneous session checks", async () => {
    vi.stubGlobal("document", { cookie: "csrf_token=test-token" });
    apiMocks.getMeApi.mockResolvedValue(adminUser);

    const firstCheck = useAdminAuthStore.getState().loadSession();
    const secondCheck = useAdminAuthStore.getState().loadSession();

    await expect(Promise.all([firstCheck, secondCheck])).resolves.toEqual([
      true,
      true,
    ]);
    expect(apiMocks.getMeApi).toHaveBeenCalledTimes(1);
    expect(useAdminAuthStore.getState().user).toEqual(adminUser);
  });
});
