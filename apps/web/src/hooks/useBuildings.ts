import { useEffect, useRef, useState } from "react";
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
  version?: number;
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

function loadBuildings(admin: boolean, force = false): Promise<Building[]> {
  const cache = admin ? adminCache : publicCache;

  if (cache.loaded && !force) {
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
  const { admin = false, version = 0 } = options;
  const cache = admin ? adminCache : publicCache;
  const [buildings, setBuildings] = useState<Building[]>(cache.data);
  const [loading, setLoading] = useState(!cache.loaded && !cache.error);
  const [error, setError] = useState<string | null>(cache.error);
  const lastVersionRef = useRef(version);

  useEffect(() => {
    let mounted = true;
    const activeCache = admin ? adminCache : publicCache;
    const forceReload = version !== lastVersionRef.current;
    lastVersionRef.current = version;

    queueMicrotask(() => {
      if (!mounted) return;

      if (activeCache.loaded && !forceReload) {
        setBuildings(activeCache.data);
        setError(activeCache.error);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
    });

    loadBuildings(admin, forceReload)
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
  }, [admin, version]);

  return { buildings, loading, error };
}
