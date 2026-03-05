import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../../stores/appStore';

const PRESETS = {
  cad: {
    bg: '#1a1a24',
    keyIntensity: 1.2,
    fillColor: '#d8dce4',
    fillIntensity: 0.5,
    rimColor: '#e0d8d0',
    rimIntensity: 0.2,
    ambientColor: '#f0f0f0',
    ambientIntensity: 0.45,
    hemiSky: '#b0b8c4',
    hemiGround: '#404048',
    hemiIntensity: 0.3,
  },
  studio: {
    bg: '#13131f',
    keyIntensity: 1.5,
    fillColor: '#a0c4ff',
    fillIntensity: 0.6,
    rimColor: '#c084fc',
    rimIntensity: 0.3,
    ambientColor: '#e8e0ff',
    ambientIntensity: 0.35,
    hemiSky: '#7c8aaa',
    hemiGround: '#3a3a4a',
    hemiIntensity: 0.4,
  },
};

export default function SceneSetup() {
  const { scene } = useThree();
  const visualStyle = useAppStore((s) => s.visualStyle);
  const p = PRESETS[visualStyle];

  useEffect(() => {
    scene.background = new THREE.Color(p.bg);
  }, [scene, p.bg]);

  return (
    <>
      {/* Key light */}
      <directionalLight
        position={[8, 12, 10]}
        intensity={p.keyIntensity}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Fill light */}
      <directionalLight
        position={[-5, 6, -8]}
        intensity={p.fillIntensity}
        color={p.fillColor}
      />

      {/* Rim light */}
      <directionalLight
        position={[0, -4, -10]}
        intensity={p.rimIntensity}
        color={p.rimColor}
      />

      {/* Ambient */}
      <ambientLight intensity={p.ambientIntensity} color={p.ambientColor} />

      {/* Hemisphere light */}
      <hemisphereLight
        args={[p.hemiSky, p.hemiGround, p.hemiIntensity]}
      />
    </>
  );
}
