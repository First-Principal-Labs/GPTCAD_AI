import { useGLTF, Center } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ModelRendererProps {
  url: string;
}

export default function ModelRenderer({ url }: ModelRendererProps) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);

    // Apply premium PBR material to all meshes
    const material = new THREE.MeshStandardMaterial({
      color: '#b0bec5',
      metalness: 0.6,
      roughness: 0.35,
      envMapIntensity: 0.8,
    });

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;

        // Compute smooth normals if not present
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    };
  }, [cloned]);

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}
