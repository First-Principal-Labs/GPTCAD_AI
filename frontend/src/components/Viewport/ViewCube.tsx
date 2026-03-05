import { useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';

export default function ViewCube() {
  return (
    <GizmoHelper alignment="top-right" margin={[64, 64]}>
      <GizmoViewport
        axisColors={['#ef4444', '#22c55e', '#3b82f6']}
        labelColor="white"
      />
    </GizmoHelper>
  );
}
