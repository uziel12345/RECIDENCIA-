import { useEffect, useState } from "react";
import type { Gate } from "@ito-map/shared";
import { getGatesApi } from "@ito-map/shared";

type GatesCacheEntry = {
  data: Gate[];
  promise: Promise<Gate[]> | null;
  error: string | null;
  loaded: boolean;
};

const cache: GatesCacheEntry = {
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

function loadGates(): Promise<Gate[]> {
  if (cache.loaded) return Promise.resolve(cache.data);

  if (!cache.promise) {
    cache.promise = getGatesApi()
      .then((gates) => {
        cache.data = gates;
        cache.error = null;
        cache.loaded = true;
        return gates;
      })
      .catch((error: unknown) => {
        cache.data = [];
        cache.error = getErrorMessage(error);
        throw error;
      })
      .finally(() => {
        cache.promise = null;
      });
  }

  return cache.promise;
}

export function useGates() {
  const [gates, setGates] = useState<Gate[]>(cache.data);
  const [loading, setLoading] = useState(!cache.loaded && !cache.error);
  const [error, setError] = useState<string | null>(cache.error);

  useEffect(() => {
    let mounted = true;

    if (cache.loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGates(cache.data);
      setError(cache.error);
      setLoading(false);
    } else {
      setLoading(true);
      setError(null);
    }

    loadGates()
      .then((data) => {
        if (!mounted) return;
        setGates(data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!mounted) return;
        setGates([]);
        setError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { gates, loading, error };
}
