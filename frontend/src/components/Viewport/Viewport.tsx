import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import SceneSetup from './SceneSetup';
import InfiniteGrid from './InfiniteGrid';
import ModelRenderer from './ModelRenderer';
import ViewCube from './ViewCube';
import { useAppStore } from '../../stores/appStore';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2a2a3e" wireframe />
    </mesh>
  );
}

export default function Viewport() {
  const modelUrl = useAppStore((s) => s.modelUrl);

  return (
    <Canvas
      shadows
      camera={{ position: [6, 4, 8], fov: 45, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.1,
      }}
      style={{ background: '#13131f' }}
    >
      <SceneSetup />

      <Environment preset="studio" environmentIntensity={0.4} />

      <InfiniteGrid />

      <Suspense fallback={<LoadingFallback />}>
        {modelUrl && <ModelRenderer url={modelUrl} />}
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={200}
        target={[0, 0, 0]}
      />

      <ViewCube />
    </Canvas>
  );
}
