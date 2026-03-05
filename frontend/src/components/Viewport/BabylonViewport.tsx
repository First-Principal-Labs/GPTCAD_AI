import { useEffect, useRef, useCallback } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  SceneLoader,
  StandardMaterial,
  PBRMaterial,
  MeshBuilder,
  DefaultRenderingPipeline,
  AbstractMesh,
  Mesh,
  DynamicTexture,
  Animation,
  CubicEase,
  EasingFunction,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { useAppStore } from '../../stores/appStore';
import RenderModeToolbar from './RenderModeToolbar';
import ManualTools from './ManualTools';

const CAD_BG = Color4.FromHexString('#1a1a24FF');
const STUDIO_BG = Color4.FromHexString('#13131fFF');

function hexToColor3(hex: string): Color3 {
  return Color3.FromHexString(hex);
}

// Camera angles for each axis view (alpha, beta)
// Babylon ArcRotateCamera: alpha = longitude, beta = latitude (0 = top, PI = bottom)
const AXIS_VIEWS: Record<string, { alpha: number; beta: number }> = {
  X:    { alpha: 0,              beta: Math.PI / 2 },     // +X: right
  negX: { alpha: Math.PI,       beta: Math.PI / 2 },     // -X: left
  Y:    { alpha: -Math.PI / 2,  beta: 0.01 },            // +Y: top
  negY: { alpha: -Math.PI / 2,  beta: Math.PI - 0.01 },  // -Y: bottom
  Z:    { alpha: -Math.PI / 2,  beta: Math.PI / 2 },     // +Z: front
  negZ: { alpha: Math.PI / 2,   beta: Math.PI / 2 },     // -Z: back
};

function animateCameraTo(camera: ArcRotateCamera, alpha: number, beta: number) {
  const fps = 60;
  const frames = 20;

  const alphaAnim = new Animation('alphaAnim', 'alpha', fps, Animation.ANIMATIONTYPE_FLOAT);
  alphaAnim.setKeys([
    { frame: 0, value: camera.alpha },
    { frame: frames, value: alpha },
  ]);

  const betaAnim = new Animation('betaAnim', 'beta', fps, Animation.ANIMATIONTYPE_FLOAT);
  betaAnim.setKeys([
    { frame: 0, value: camera.beta },
    { frame: frames, value: beta },
  ]);

  const ease = new CubicEase();
  ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  alphaAnim.setEasingFunction(ease);
  betaAnim.setEasingFunction(ease);

  camera.animations = [alphaAnim, betaAnim];
  camera.getScene().beginAnimation(camera, 0, frames, false);
}

function createAxisGizmo(canvas: HTMLCanvasElement, mainCamera: ArcRotateCamera) {
  const engine = new Engine(canvas, true, { antialias: true, alpha: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 0);
  scene.autoClear = true;

  const camera = new ArcRotateCamera('gizmoCam', 0, 0, 4, Vector3.Zero(), scene);
  camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
  const orthoSize = 1.6;
  camera.orthoLeft = -orthoSize;
  camera.orthoRight = orthoSize;
  camera.orthoTop = orthoSize;
  camera.orthoBottom = -orthoSize;

  const light = new HemisphericLight('gizmoLight', new Vector3(0, 1, 0), scene);
  light.intensity = 1.0;

  const axisLen = 0.9;
  const sphereR = 0.18;
  const negSphereR = 0.1;

  const axes = [
    { label: 'X', dir: new Vector3(1, 0, 0), color: '#ef4444', negColor: '#7f1d1d' },
    { label: 'Y', dir: new Vector3(0, 1, 0), color: '#22c55e', negColor: '#14532d' },
    { label: 'Z', dir: new Vector3(0, 0, 1), color: '#3b82f6', negColor: '#1e3a5f' },
  ];

  // Store sphere materials for hover highlighting
  const sphereMaterials: Map<string, { mat: StandardMaterial; baseEmissive: Color3 }> = new Map();

  axes.forEach(({ label, dir, color, negColor }) => {
    // Axis line (not pickable)
    const line = MeshBuilder.CreateTube(`axis_${label}`, {
      path: [Vector3.Zero(), dir.scale(axisLen)],
      radius: 0.03,
      tessellation: 8,
    }, scene);
    const lineMat = new StandardMaterial(`lineMat_${label}`, scene);
    lineMat.diffuseColor = Color3.FromHexString(color);
    lineMat.emissiveColor = Color3.FromHexString(color).scale(0.4);
    line.material = lineMat;
    line.isPickable = false;

    // Positive sphere with label (pickable)
    const sphere = MeshBuilder.CreateSphere(`sphere_${label}`, { diameter: sphereR * 2, segments: 16 }, scene);
    sphere.position = dir.scale(axisLen + sphereR + 0.05);
    const sphereMat = new StandardMaterial(`sphereMat_${label}`, scene);
    sphereMat.diffuseColor = Color3.FromHexString(color);
    sphereMat.emissiveColor = Color3.FromHexString(color).scale(0.3);
    const tex = new DynamicTexture(`tex_${label}`, { width: 64, height: 64 }, scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 64, 64);
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(label, 32, 34);
    tex.update();
    sphereMat.diffuseTexture = tex;
    sphere.material = sphereMat;
    sphere.isPickable = true;
    sphereMaterials.set(`sphere_${label}`, { mat: sphereMat, baseEmissive: Color3.FromHexString(color).scale(0.3) });

    // Negative sphere (pickable)
    const negSphere = MeshBuilder.CreateSphere(`negSphere_${label}`, { diameter: negSphereR * 2, segments: 12 }, scene);
    negSphere.position = dir.scale(-(axisLen * 0.5));
    const negMat = new StandardMaterial(`negMat_${label}`, scene);
    negMat.diffuseColor = Color3.FromHexString(negColor);
    negMat.emissiveColor = Color3.FromHexString(negColor).scale(0.2);
    negSphere.material = negMat;
    negSphere.isPickable = true;
    sphereMaterials.set(`negSphere_${label}`, { mat: negMat, baseEmissive: Color3.FromHexString(negColor).scale(0.2) });
  });

  // Center sphere (not pickable)
  const centerMesh = MeshBuilder.CreateSphere('center', { diameter: 0.14, segments: 12 }, scene);
  const centerMat = new StandardMaterial('centerMat', scene);
  centerMat.diffuseColor = Color3.FromHexString('#14532d');
  centerMat.emissiveColor = Color3.FromHexString('#14532d').scale(0.3);
  centerMesh.material = centerMat;
  centerMesh.isPickable = false;

  // Click handler — snap main camera to axis view
  scene.onPointerDown = (_evt, pickResult) => {
    if (!pickResult?.hit || !pickResult.pickedMesh) return;
    const name = pickResult.pickedMesh.name;

    let viewKey: string | null = null;
    if (name === 'sphere_X') viewKey = 'X';
    else if (name === 'sphere_Y') viewKey = 'Y';
    else if (name === 'sphere_Z') viewKey = 'Z';
    else if (name === 'negSphere_X') viewKey = 'negX';
    else if (name === 'negSphere_Y') viewKey = 'negY';
    else if (name === 'negSphere_Z') viewKey = 'negZ';

    if (viewKey && AXIS_VIEWS[viewKey]) {
      const { alpha, beta } = AXIS_VIEWS[viewKey];
      animateCameraTo(mainCamera, alpha, beta);
    }
  };

  // Hover highlight
  let lastHovered: string | null = null;
  scene.onPointerMove = (_evt, pickResult) => {
    // Reset previous hover
    if (lastHovered) {
      const entry = sphereMaterials.get(lastHovered);
      if (entry) entry.mat.emissiveColor = entry.baseEmissive;
      lastHovered = null;
    }

    if (!pickResult?.hit || !pickResult.pickedMesh) {
      canvas.style.cursor = 'default';
      return;
    }

    const name = pickResult.pickedMesh.name;
    const entry = sphereMaterials.get(name);
    if (entry) {
      entry.mat.emissiveColor = entry.baseEmissive.scale(3);
      lastHovered = name;
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  // Sync rotation and render
  engine.runRenderLoop(() => {
    camera.alpha = mainCamera.alpha;
    camera.beta = mainCamera.beta;
    scene.render();
  });

  const handleResize = () => engine.resize();
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvas);

  return {
    dispose: () => {
      resizeObserver.disconnect();
      scene.dispose();
      engine.dispose();
    },
  };
}

interface SceneRefs {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  pipeline: DefaultRenderingPipeline;
  shadowGen: ShadowGenerator;
  keyLight: DirectionalLight;
  fillLight: DirectionalLight;
  rimLight: DirectionalLight;
  ambientLight: HemisphericLight;
  hemiLight: HemisphericLight;
  gridMesh: Mesh;
  loadedMeshes: AbstractMesh[];
  cadMaterial: PBRMaterial;
  studioPBR: PBRMaterial;
  wireframeMaterial: StandardMaterial;
  xrayMaterial: PBRMaterial;
}

export default function BabylonViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gizmoCanvasRef = useRef<HTMLCanvasElement>(null);
  const gizmoRef = useRef<{ dispose: () => void } | null>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const modelUrl = useAppStore((s) => s.modelUrl);
  const renderMode = useAppStore((s) => s.renderMode);
  const visualStyle = useAppStore((s) => s.visualStyle);
  const fitViewTrigger = useAppStore((s) => s.fitViewTrigger);
  const setModelInfo = useAppStore((s) => s.setModelInfo);

  // Initialize engine and scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    const scene = new Scene(engine);
    scene.clearColor = CAD_BG;

    // Camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 4,
      Math.PI / 3,
      12,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 200;
    camera.wheelDeltaPercentage = 0.02;
    camera.inertia = 0.92;
    camera.panningInertia = 0.92;
    camera.fov = 0.785; // ~45 degrees

    // Key light
    const keyLight = new DirectionalLight('key', new Vector3(-8, -12, -10), scene);
    keyLight.intensity = 1.2;
    keyLight.diffuse = Color3.White();

    // Shadow generator
    const shadowGen = new ShadowGenerator(2048, keyLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    // Fill light
    const fillLight = new DirectionalLight('fill', new Vector3(5, -6, 8), scene);
    fillLight.intensity = 0.5;
    fillLight.diffuse = hexToColor3('#d8dce4');

    // Rim light
    const rimLight = new DirectionalLight('rim', new Vector3(0, 4, 10), scene);
    rimLight.intensity = 0.2;
    rimLight.diffuse = hexToColor3('#e0d8d0');

    // Ambient (hemisphere pointing up)
    const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.45;
    ambientLight.diffuse = hexToColor3('#f0f0f0');
    ambientLight.groundColor = hexToColor3('#f0f0f0');

    // Hemisphere light
    const hemiLight = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.3;
    hemiLight.diffuse = hexToColor3('#b0b8c4');
    hemiLight.groundColor = hexToColor3('#404048');

    // Post-processing pipeline
    const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, [camera]);
    pipeline.samples = 4; // MSAA
    pipeline.fxaaEnabled = true;
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.toneMappingType = 1; // ACES
    pipeline.imageProcessing.exposure = 0.95;

    // Materials
    const cadMaterial = new PBRMaterial('cad', scene);
    cadMaterial.albedoColor = hexToColor3('#8b939b');
    cadMaterial.metallic = 0.15;
    cadMaterial.roughness = 0.55;
    cadMaterial.environmentIntensity = 0.3;
    cadMaterial.backFaceCulling = false;

    const studioPBR = new PBRMaterial('studio', scene);
    studioPBR.albedoColor = hexToColor3('#b0bec5');
    studioPBR.metallic = 0.6;
    studioPBR.roughness = 0.35;
    studioPBR.environmentIntensity = 0.8;
    studioPBR.backFaceCulling = false;

    const wireframeMaterial = new StandardMaterial('wireframe', scene);
    wireframeMaterial.diffuseColor = hexToColor3('#6366f1');
    wireframeMaterial.wireframe = true;

    const xrayMaterial = new PBRMaterial('xray', scene);
    xrayMaterial.albedoColor = hexToColor3('#6366f1');
    xrayMaterial.metallic = 0.0;
    xrayMaterial.roughness = 0.4;
    xrayMaterial.alpha = 0.25;
    xrayMaterial.backFaceCulling = false;
    xrayMaterial.transparencyMode = 2; // ALPHA_BLEND

    // Grid
    const gridMesh = MeshBuilder.CreateGround('grid', { width: 100, height: 100, subdivisions: 100 }, scene);
    const gridMat = new StandardMaterial('gridMat', scene);
    gridMat.diffuseColor = hexToColor3('#1e1e2e');
    gridMat.alpha = 0.4;
    gridMat.wireframe = true;
    gridMesh.material = gridMat;
    gridMesh.position.y = -0.01;
    gridMesh.isPickable = false;

    // Render loop
    engine.runRenderLoop(() => scene.render());

    // Resize
    const handleResize = () => engine.resize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    sceneRef.current = {
      engine,
      scene,
      camera,
      pipeline,
      shadowGen,
      keyLight,
      fillLight,
      rimLight,
      ambientLight,
      hemiLight,
      gridMesh,
      loadedMeshes: [],
      cadMaterial,
      studioPBR,
      wireframeMaterial,
      xrayMaterial,
    };

    // Initialize axis gizmo
    if (gizmoCanvasRef.current) {
      gizmoRef.current = createAxisGizmo(gizmoCanvasRef.current, camera);
    }

    return () => {
      gizmoRef.current?.dispose();
      gizmoRef.current = null;
      resizeObserver.disconnect();
      scene.dispose();
      engine.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Load model
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;

    // Dispose previous meshes
    refs.loadedMeshes.forEach((m) => m.dispose());
    refs.loadedMeshes = [];

    if (!modelUrl) return;

    // Parse the URL for SceneLoader
    const lastSlash = modelUrl.lastIndexOf('/');
    const rootUrl = modelUrl.substring(0, lastSlash + 1);
    const fileName = modelUrl.substring(lastSlash + 1);

    SceneLoader.ImportMeshAsync('', rootUrl, fileName, refs.scene).then((result) => {
      let totalFaces = 0;
      let totalVertices = 0;

      result.meshes.forEach((mesh) => {
        if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
          refs.shadowGen.addShadowCaster(mesh);
          mesh.receiveShadows = true;
          totalFaces += mesh.getTotalIndices() / 3;
          totalVertices += mesh.getTotalVertices();
        }
      });

      refs.loadedMeshes = result.meshes;

      // Compute bounding info
      let min = new Vector3(Infinity, Infinity, Infinity);
      let max = new Vector3(-Infinity, -Infinity, -Infinity);
      result.meshes.forEach((mesh) => {
        if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
          const bounds = mesh.getBoundingInfo().boundingBox;
          min = Vector3.Minimize(min, bounds.minimumWorld);
          max = Vector3.Maximize(max, bounds.maximumWorld);
        }
      });

      const size = max.subtract(min);
      setModelInfo({
        faces: Math.round(totalFaces),
        vertices: totalVertices,
        bbox: [
          Math.round(size.x * 10) / 10,
          Math.round(size.y * 10) / 10,
          Math.round(size.z * 10) / 10,
        ],
      });

      // Frame the model
      const center = min.add(max).scale(0.5);
      refs.camera.target = center;
      const radius = Vector3.Distance(min, max) * 0.8;
      refs.camera.radius = Math.max(radius, 3);

      // Apply current material
      applyMaterial(refs);
    });
  }, [modelUrl, setModelInfo]);

  const applyMaterial = useCallback((refs: SceneRefs) => {
    const mode = useAppStore.getState().renderMode;
    const style = useAppStore.getState().visualStyle;

    let material: PBRMaterial | StandardMaterial;
    if (mode === 'wireframe') {
      material = refs.wireframeMaterial;
    } else if (mode === 'xray') {
      material = refs.xrayMaterial;
    } else {
      material = style === 'studio' ? refs.studioPBR : refs.cadMaterial;
    }

    const showEdges = mode === 'wireframe'
      ? false
      : style === 'cad'
        ? true
        : mode === 'shaded-wireframe' || mode === 'xray';

    const edgeColor = mode === 'xray'
      ? hexToColor3('#818cf8')
      : style === 'cad'
        ? hexToColor3('#2a2d32')
        : hexToColor3('#000000');

    refs.loadedMeshes.forEach((mesh) => {
      if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
        mesh.material = material;
        if (showEdges) {
          mesh.enableEdgesRendering();
          mesh.edgesWidth = mode === 'shaded' ? 1.5 : 2.0;
          mesh.edgesColor = new Color4(edgeColor.r, edgeColor.g, edgeColor.b, 1);
        } else {
          mesh.disableEdgesRendering();
        }
      }
    });
  }, []);

  // Update visual style
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;

    if (visualStyle === 'studio') {
      refs.scene.clearColor = STUDIO_BG;
      refs.keyLight.intensity = 1.5;
      refs.fillLight.intensity = 0.6;
      refs.fillLight.diffuse = hexToColor3('#a0c4ff');
      refs.rimLight.intensity = 0.3;
      refs.rimLight.diffuse = hexToColor3('#c084fc');
      refs.ambientLight.intensity = 0.35;
      refs.ambientLight.diffuse = hexToColor3('#e8e0ff');
      refs.hemiLight.intensity = 0.4;
      refs.hemiLight.diffuse = hexToColor3('#7c8aaa');
      refs.hemiLight.groundColor = hexToColor3('#3a3a4a');
      refs.pipeline.imageProcessing.exposure = 1.1;
    } else {
      refs.scene.clearColor = CAD_BG;
      refs.keyLight.intensity = 1.2;
      refs.fillLight.intensity = 0.5;
      refs.fillLight.diffuse = hexToColor3('#d8dce4');
      refs.rimLight.intensity = 0.2;
      refs.rimLight.diffuse = hexToColor3('#e0d8d0');
      refs.ambientLight.intensity = 0.45;
      refs.ambientLight.diffuse = hexToColor3('#f0f0f0');
      refs.hemiLight.intensity = 0.3;
      refs.hemiLight.diffuse = hexToColor3('#b0b8c4');
      refs.hemiLight.groundColor = hexToColor3('#404048');
      refs.pipeline.imageProcessing.exposure = 0.95;
    }

    applyMaterial(refs);
  }, [visualStyle, applyMaterial]);

  // Update render mode
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;

    // Toggle SSAO based on render mode
    if (renderMode === 'wireframe') {
      refs.pipeline.samples = 1;
    } else {
      refs.pipeline.samples = 4;
    }

    applyMaterial(refs);
  }, [renderMode, applyMaterial]);

  // Fit view
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs || fitViewTrigger === 0) return;

    if (refs.loadedMeshes.length > 0) {
      let min = new Vector3(Infinity, Infinity, Infinity);
      let max = new Vector3(-Infinity, -Infinity, -Infinity);
      refs.loadedMeshes.forEach((mesh) => {
        if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
          const bounds = mesh.getBoundingInfo().boundingBox;
          min = Vector3.Minimize(min, bounds.minimumWorld);
          max = Vector3.Maximize(max, bounds.maximumWorld);
        }
      });
      const center = min.add(max).scale(0.5);
      refs.camera.target = center;
      const radius = Vector3.Distance(min, max) * 0.8;
      refs.camera.radius = Math.max(radius, 3);
    } else {
      refs.camera.target = Vector3.Zero();
      refs.camera.radius = 12;
      refs.camera.alpha = -Math.PI / 4;
      refs.camera.beta = Math.PI / 3;
    }
  }, [fitViewTrigger]);

  return (
    <div className="relative w-full h-full">
      <RenderModeToolbar />
      <ManualTools />
      <canvas ref={canvasRef} className="w-full h-full outline-none" style={{ background: '#1a1a24' }} />
      <canvas
        ref={gizmoCanvasRef}
        width={128}
        height={128}
        className="absolute outline-none"
        style={{ top: 8, right: 8, width: 128, height: 128 }}
      />
    </div>
  );
}
