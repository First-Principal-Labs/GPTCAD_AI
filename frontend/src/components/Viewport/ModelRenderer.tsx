import { useGLTF, Center, Edges } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../../stores/appStore';

interface ModelRendererProps {
  url: string;
}

// CAD style: satin matte, easy to read geometry
const CAD_SHADED = new THREE.MeshStandardMaterial({
  color: '#8b939b',
  metalness: 0.15,
  roughness: 0.55,
  envMapIntensity: 0.3,
  side: THREE.DoubleSide,
});

// Studio style: glossy metallic, premium showcase look
const STUDIO_SHADED = new THREE.MeshStandardMaterial({
  color: '#b0bec5',
  metalness: 0.6,
  roughness: 0.35,
  envMapIntensity: 0.8,
  side: THREE.DoubleSide,
});

const WIREFRAME_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#6366f1',
  wireframe: true,
});

const XRAY_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: '#6366f1',
  metalness: 0.0,
  roughness: 0.4,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function getMaterial(mode: string, style: string): THREE.Material {
  switch (mode) {
    case 'wireframe':
      return WIREFRAME_MATERIAL;
    case 'xray':
      return XRAY_MATERIAL;
    default:
      return style === 'studio' ? STUDIO_SHADED : CAD_SHADED;
  }
}

export default function ModelRenderer({ url }: ModelRendererProps) {
  const { scene } = useGLTF(url);
  const renderMode = useAppStore((s) => s.renderMode);
  const visualStyle = useAppStore((s) => s.visualStyle);
  const setModelInfo = useAppStore((s) => s.setModelInfo);
  const groupRef = useRef<THREE.Group>(null);

  const meshes = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] = [];
    let totalFaces = 0;
    let totalVertices = 0;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geo = child.geometry.clone();
        if (!geo.attributes.normal) {
          geo.computeVertexNormals();
        }
        // Get world matrix
        child.updateWorldMatrix(true, false);
        result.push({ geometry: geo, matrix: child.matrixWorld.clone() });

        totalFaces += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
        totalVertices += geo.attributes.position.count;
      }
    });

    // Compute bounding box
    const box = new THREE.Box3();
    result.forEach(({ geometry, matrix }) => {
      geometry.applyMatrix4(matrix);
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        box.union(geometry.boundingBox);
      }
    });

    const size = new THREE.Vector3();
    if (!box.isEmpty()) {
      box.getSize(size);
    }

    // Set model info in store (deferred to avoid render-during-render)
    setTimeout(() => {
      setModelInfo({
        faces: Math.round(totalFaces),
        vertices: totalVertices,
        bbox: [
          Math.round(size.x * 10) / 10,
          Math.round(size.y * 10) / 10,
          Math.round(size.z * 10) / 10,
        ],
      });
    }, 0);

    return result;
  }, [scene, setModelInfo]);

  useEffect(() => {
    return () => {
      meshes.forEach(({ geometry }) => geometry.dispose());
    };
  }, [meshes]);

  const material = getMaterial(renderMode, visualStyle);

  // CAD style: always show edges in shaded mode for readability
  // Studio style: only show edges in shaded-wireframe and xray modes
  const showEdges = renderMode === 'wireframe'
    ? false
    : visualStyle === 'cad'
      ? true
      : renderMode === 'shaded-wireframe' || renderMode === 'xray';

  const edgeColor = renderMode === 'xray'
    ? '#818cf8'
    : visualStyle === 'cad'
      ? '#2a2d32'
      : '#000000';

  return (
    <Center>
      <group ref={groupRef}>
        {meshes.map(({ geometry }, i) => (
          <mesh key={i} geometry={geometry} material={material} castShadow receiveShadow>
            {showEdges && (
              <Edges
                threshold={15}
                color={edgeColor}
                lineWidth={renderMode === 'shaded' ? 0.8 : 1.0}
              />
            )}
          </mesh>
        ))}
      </group>
    </Center>
  );
}
