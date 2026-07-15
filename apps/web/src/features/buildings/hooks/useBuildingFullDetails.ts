import { useEffect, useState } from "react";
import { getBuildingFullDetailsApi } from "@ito-map/shared";
import type { BuildingFullDetails } from "@ito-map/shared";

type UseBuildingFullDetailsResult = {
  data: BuildingFullDetails | null;
  loading: boolean;
  error: string | null;
};

export function useBuildingFullDetails(
  buildingId: string | null
): UseBuildingFullDetailsResult {
  const [data, setData] = useState<BuildingFullDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBuildingFullDetailsApi(buildingId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la información del edificio"
        );
        if (import.meta.env.DEV) {
          console.error("useBuildingFullDetails", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  return { data, loading, error };
}
