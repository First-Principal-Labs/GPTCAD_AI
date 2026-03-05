import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export default function SceneSetup() {
  const { scene } = useThree();

  useEffect(() => {
    // Gradient background
    scene.background = new THREE.Color('#13131f');
  }, [scene]);

  return (
    <>
      {/* Key light */}
      <directionalLight
        position={[8, 12, 10]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Fill light */}
      <directionalLight
        position={[-5, 6, -8]}
        intensity={0.6}
        color="#a0c4ff"
      />

      {/* Rim light */}
      <directionalLight
        position={[0, -4, -10]}
        intensity={0.3}
        color="#c084fc"
      />

      {/* Ambient */}
      <ambientLight intensity={0.35} color="#e8e0ff" />

      {/* Hemisphere light for subtle sky/ground coloring */}
      <hemisphereLight
        args={['#7c8aaa', '#3a3a4a', 0.4]}
      />
    </>
  );
}
