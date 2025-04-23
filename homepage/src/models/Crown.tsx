import { useGLTF } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    'indicator-round-d_1': THREE.Mesh;
  };
  materials: {
    colormap: THREE.MeshStandardMaterial;
  };
};

export function Crown(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(
    '/models/indicator-round-d.glb',
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes['indicator-round-d_1'].geometry}
        material={materials.colormap}
        // scale={[0.5, 1, 0.5]}
      >
        {/* <meshBasicMaterial color="white" /> */}
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/indicator-round-d.glb');
