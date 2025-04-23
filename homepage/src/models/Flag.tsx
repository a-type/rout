import { useGLTF } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    flag_1: THREE.Mesh;
  };
  materials: {
    colormap: THREE.MeshStandardMaterial;
  };
};

export function Flag(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(
    '/models/flag.glb',
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.flag_1.geometry} material={materials.colormap} />
    </group>
  );
}

useGLTF.preload('/models/flag.glb');
