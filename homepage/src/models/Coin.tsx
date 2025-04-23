import { useGLTF } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    coin_1: THREE.Mesh;
  };
  materials: {
    colormap: THREE.MeshStandardMaterial;
  };
};

export function Coin(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(
    '/models/coin.glb',
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.coin_1.geometry} material={materials.colormap} />
    </group>
  );
}

useGLTF.preload('/models/coin.glb');
