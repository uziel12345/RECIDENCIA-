import { useFrame } from "@react-three/fiber";
import type { Vector3 } from "three";

export type CameraAnim = { pos: Vector3; look: Vector3 };

export function CameraAnimator({
  animRef,
  controlsRef,
}: {
  animRef: { current: CameraAnim | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: { current: any };
}) {
  useFrame((_, delta) => {
    const anim = animRef.current;
    const ctrl = controlsRef.current;

    if (!anim || !ctrl) {
      // Restore user interaction when no animation is active
      if (ctrl && !ctrl.enabled) ctrl.enabled = true;
      return;
    }

    // Suppress drei's automatic OrbitControls.update() (priority -1).
    // drei checks `controls.enabled` before calling update(), so setting it
    // false here (we run at -2, before drei at -1) prevents OrbitControls
    // from overwriting our lerped positions each frame.
    ctrl.enabled = false;

    // Frame-rate independent lerp — 97 % of the way in ~0.5 s
    const alpha = 1 - Math.pow(0.001, delta);
    ctrl.object.position.lerp(anim.pos, alpha);
    ctrl.target.lerp(anim.look, alpha);
    // Manual update syncs OrbitControls' internal spherical state and
    // rotates the camera to face ctrl.target
    ctrl.update();

    if (
      ctrl.object.position.distanceTo(anim.pos) < 0.5 &&
      ctrl.target.distanceTo(anim.look) < 0.5
    ) {
      ctrl.object.position.copy(anim.pos);
      ctrl.target.copy(anim.look);
      ctrl.update();
      ctrl.enabled = true;  // hand control back to the user
      animRef.current = null;
    }
  }, -2); // priority -2: runs before drei OrbitControls (priority -1)
  return null;
}
