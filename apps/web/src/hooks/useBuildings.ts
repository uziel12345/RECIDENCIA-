import { useEffect, useState } from "react";
import type { Building } from "@ito-map/shared";
import { getAdminBuildings, getBuildings } from "../services/buildings.service";

type BuildingsCacheEntry = {
  data: Building[];
  promise: Promise<Building[]> | null;
  error: string | null;
  loaded: boolean;
};

type UseBuildingsOptions = {
  admin?: boolean;
};

const publicCache: BuildingsCacheEntry = {
  data: [],
  promise: null,
  error: null,
  loaded: false,
};

const adminCache: BuildingsCacheEntry = {
  data: [],
  promise: null,
  error: null,
  loaded: false,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.";
}

function loadBuildings(admin: boolean): Promise<Building[]> {
  const cache = admin ? adminCache : publicCache;

  if (cache.loaded) {
    return Promise.resolve(cache.data);
  }

  if (!cache.promise) {
    const fetchBuildings = admin ? getAdminBuildings : getBuildings;

    cache.promise = fetchBuildings()
      .then((buildings) => {
        cache.data = buildings;
        cache.error = null;
        cache.loaded = true;
        return buildings;
      })
      .catch((error: unknown) => {
        cache.data = [];
        cache.error = getErrorMessage(error);
        // cache.loaded permanece false → permite reintentar
        throw error;
      })
      .finally(() => {
        cache.promise = null;
      });
  }

  return cache.promise;
}

export function useBuildings(options: UseBuildingsOptions = {}) {
  const admin = options.admin ?? false;
  const cache = admin ? adminCache : publicCache;
  const [buildings, setBuildings] = useState<Building[]>(cache.data);
  const [loading, setLoading] = useState(!cache.loaded && !cache.error);
  const [error, setError] = useState<string | null>(cache.error);

  useEffect(() => {
    let mounted = true;
    const activeCache = admin ? adminCache : publicCache;

    if (activeCache.loaded) {
      setBuildings(activeCache.data);
      setError(activeCache.error);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    loadBuildings(admin)
      .then((data) => {
        if (!mounted) return;
        setBuildings(data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!mounted) return;
        setBuildings([]);
        setError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [admin]);

  return { buildings, loading, error };
}
