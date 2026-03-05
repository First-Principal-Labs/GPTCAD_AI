import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense } from 'react';
import SceneSetup from './SceneSetup';
import InfiniteGrid from './InfiniteGrid';
import ModelRenderer from './ModelRenderer';
import ViewCube from './ViewCube';
import RenderModeToolbar from './RenderModeToolbar';
import { useAppStore } from '../../stores/appStore';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2a2a3e" wireframe />
    </mesh>
  );
}

function PostProcessing() {
  const renderMode = useAppStore((s) => s.renderMode);

  // Only apply SSAO in shaded modes
  if (renderMode === 'wireframe') return null;

  return (
    <EffectComposer>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        radius={0.1}
        intensity={15}
      />
      <Bloom
        intensity={0.05}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
      />
    </EffectComposer>
  );
}

export default function Viewport() {
  const modelUrl = useAppStore((s) => s.modelUrl);

  return (
    <div className="relative w-full h-full">
      <RenderModeToolbar />

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

        <PostProcessing />

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
    </div>
  );
}
