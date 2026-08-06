import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { MARKER_SMOOTHING_SPEED } from "../config/campus-location.config";
import type { CampusMapPosition } from "../types/device-location.types";

type DeviceLocationMarkerProps = {
  position: CampusMapPosition;
};

export function DeviceLocationMarker({ position }: DeviceLocationMarkerProps) {
  const groupRef = useRef<Group>(null);
  const pulseRef = useRef<Mesh>(null);
  const initializedRef = useRef(false);
  const targetRef = useRef(new Vector3(position.x, position.y, position.z));
  const { invalidate } = useThree();

  const pointGeometry = useMemo(() => new SphereGeometry(0.72, 24, 16), []);
  const pulseGeometry = useMemo(() => new RingGeometry(0.92, 1.12, 48), []);
  const pointMaterial = useMemo(
    () => new MeshBasicMaterial({ color: "#2563eb", depthTest: false }),
    [],
  );
  const coreMaterial = useMemo(
    () => new MeshBasicMaterial({ color: "#ffffff", depthTest: false }),
    [],
  );
  const pulseMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

  useEffect(() => {
    targetRef.current.set(position.x, position.y, position.z);
    if (!initializedRef.current && groupRef.current) {
      groupRef.current.position.copy(targetRef.current);
      initializedRef.current = true;
    }
    invalidate();
  }, [invalidate, position.x, position.y, position.z]);

  useEffect(
    () => () => {
      pointGeometry.dispose();
      pulseGeometry.dispose();
      pointMaterial.dispose();
      coreMaterial.dispose();
      pulseMaterial.dispose();
    }, [
      coreMaterial,
      pointGeometry,
      pointMaterial,
      pulseGeometry,
      pulseMaterial,
    ]
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const interpolation = 1 - Math.exp(-MARKER_SMOOTHING_SPEED * delta);
    group.position.lerp(targetRef.current, interpolation);

    const pulse = pulseRef.current;
    if (pulse) {
      const wave = (Math.sin(clock.elapsedTime * 2.4) + 1) / 2;
      const scale = 1 + wave * 0.65;
      pulse.scale.setScalar(scale);
    }
    invalidate();
  });

  return (
    <group ref={groupRef} renderOrder={1_000}>
      <mesh
        geometry={pointGeometry}
        material={pointMaterial}
        raycast={() => undefined}
      />
      <mesh
        scale={0.43}
        geometry={pointGeometry}
        material={coreMaterial}
        raycast={() => undefined}
      />
      <mesh
        ref={pulseRef}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={pulseGeometry}
        material={pulseMaterial}
        raycast={() => undefined}
      />
    </group>
  );
}
