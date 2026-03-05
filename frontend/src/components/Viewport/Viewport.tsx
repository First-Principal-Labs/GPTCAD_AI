import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import SceneSetup from './SceneSetup';
import InfiniteGrid from './InfiniteGrid';
import ModelRenderer from './ModelRenderer';
import ViewCube from './ViewCube';
import RenderModeToolbar from './RenderModeToolbar';
import ManualTools from './ManualTools';
import { useAppStore } from '../../stores/appStore';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2a2a3e" wireframe />
    </mesh>
  );
}

function FitViewHandler() {
  const { camera, scene } = useThree();
  const fitViewTrigger = useAppStore((s) => s.fitViewTrigger);
  const prevTrigger = useRef(fitViewTrigger);

  useEffect(() => {
    if (fitViewTrigger !== prevTrigger.current) {
      prevTrigger.current = fitViewTrigger;
      // Reset camera to default position
      camera.position.set(6, 4, 8);
      camera.lookAt(0, 0, 0);
    }
  }, [fitViewTrigger, camera, scene]);

  return null;
}

function ToneMappingController() {
  const { gl } = useThree();
  const visualStyle = useAppStore((s) => s.visualStyle);

  useEffect(() => {
    gl.toneMappingExposure = visualStyle === 'cad' ? 0.95 : 1.1;
  }, [gl, visualStyle]);

  return null;
}

function PostProcessing() {
  const renderMode = useAppStore((s) => s.renderMode);
  const visualStyle = useAppStore((s) => s.visualStyle);

  // Only apply SSAO in shaded modes
  if (renderMode === 'wireframe') return null;

  return (
    <EffectComposer>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        radius={visualStyle === 'cad' ? 0.15 : 0.1}
        intensity={visualStyle === 'cad' ? 5 : 15}
      />
    </EffectComposer>
  );
}

function EnvironmentController() {
  const visualStyle = useAppStore((s) => s.visualStyle);
  return <Environment preset="studio" environmentIntensity={visualStyle === 'cad' ? 0.2 : 0.4} />;
}

export default function Viewport() {
  const modelUrl = useAppStore((s) => s.modelUrl);

  return (
    <div className="relative w-full h-full">
      <RenderModeToolbar />
      <ManualTools />

      <Canvas
        shadows
        camera={{ position: [6, 4, 8], fov: 45, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 0.95,
        }}
        style={{ background: '#1a1a24' }}
      >
        <SceneSetup />
        <ToneMappingController />

        <EnvironmentController />

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

        <FitViewHandler />
        <ViewCube />
      </Canvas>
    </div>
  );
}
