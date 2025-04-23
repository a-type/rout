import { clsx } from '@a-type/ui';
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  Float,
  Outlines,
  Text3D,
  useBounds,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { Coin } from './models/Coin';
import { Flag } from './models/Flag';
import { Sword } from './models/Sword';

export interface SceneProps {
  className?: string;
}

export function Scene({ className }: SceneProps) {
  return (
    <Canvas
      className={clsx(className)}
      shadows
      camera={{ position: [0, 1.5, 4] }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[-10, 0, -5]}
        intensity={10}
        color="#ffffff"
      />
      <directionalLight
        position={[-1, -2, -5]}
        intensity={0.2}
        color="#ffffff"
      />
      <spotLight
        position={[5, 0, 5]}
        intensity={2.5}
        penumbra={1}
        angle={0.3}
        color="#ffffff"
      />

      <Bounds fit clip margin={1}>
        <Stuff />
      </Bounds>

      <ContactShadows
        position={[0, 0, -2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={5}
        blur={1.5}
        far={1}
      />
      <Environment preset="city" />

      {/* <OrbitControls makeDefault /> */}
    </Canvas>
  );
}

function Stuff() {
  const groupRef = useRef<Group>(null!);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() / 20;
    }
  });

  const textProps = {
    font: '/fonts/Knewave_Regular.json',
    bevelEnabled: true,
    bevelSegments: 1,
    bevelThickness: 0.1,
    curveSegments: 4,
  };

  const objectScale = 4;

  const bounds = useBounds();
  useEffect(() => {
    groupRef.current?.updateWorldMatrix(true, false);
    const timeout = setTimeout(() => {
      bounds.refresh();
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [bounds]);

  return (
    <>
      <group
        scale={[objectScale, objectScale, objectScale]}
        rotation={[0, Math.PI / 2, 0]}
        ref={groupRef}
      >
        <Float
          position={[1, 0.3, -0.75]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={4}
          floatIntensity={6}
          speed={0.5}
        >
          <Sword />
        </Float>
        <Float
          position={[0, 0.1, 1]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={4}
          floatIntensity={6}
          speed={0.5}
        >
          <Coin />
        </Float>
        <Float
          position={[-1, 0, -0.25]}
          rotation={[0, 0, 0]}
          rotationIntensity={4}
          floatIntensity={6}
          speed={0.5}
        >
          <Flag />
        </Float>
      </group>
      <group rotation={[0, 0, 0]} position={[0, 0, 1]}>
        <Float
          rotationIntensity={0.5}
          rotation={[-Math.PI / 32, Math.PI / 4, Math.PI / 16]}
          position={[-1.8, 1.75, 0.5]}
        >
          <Center>
            <Text3D {...textProps}>
              Never
              <meshToonMaterial color="#ffffff" />
              <Outlines thickness={3} color="black" />
            </Text3D>
          </Center>
        </Float>
        <Float
          rotationIntensity={0.5}
          position={[2.1, 1.5, 0.5]}
          rotation={[0, -Math.PI / 8, Math.PI / 32]}
        >
          <Center>
            <Text3D {...textProps}>
              Lose
              <meshToonMaterial color="#ffffff" />
              <Outlines thickness={3} color="black" />
            </Text3D>
          </Center>
        </Float>
        <Float
          rotationIntensity={0.5}
          position={[0, -0.5, 0.5]}
          rotation={[0, Math.PI / 16, Math.PI / 16]}
        >
          <Center>
            <Text3D {...textProps}>
              Touch
              <meshToonMaterial color="#ffffff" />
              <Outlines thickness={3} color="black" />
            </Text3D>
          </Center>
        </Float>
      </group>
    </>
  );
}
