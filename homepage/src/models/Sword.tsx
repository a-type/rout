import { useGLTF } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    'weapon-sword_1': THREE.Mesh;
  };
  materials: {
    colormap: THREE.MeshStandardMaterial;
  };
};

export function Sword(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(
    '/models/weapon-sword.glb',
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes['weapon-sword_1'].geometry}
        material={materials.colormap}
      />
    </group>
  );
}

useGLTF.preload('/models/weapon-sword.glb');
