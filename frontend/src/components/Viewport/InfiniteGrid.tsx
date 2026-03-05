import { Grid } from '@react-three/drei';

export default function InfiniteGrid() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[100, 100]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#1e1e2e"
      sectionSize={10}
      sectionThickness={1}
      sectionColor="#2a2a3e"
      fadeDistance={60}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}
