import { clsx } from '@a-type/ui';
import {
  Bounds,
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
  Text3D,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
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
      className={clsx('pointer-events-none', className)}
      shadows
      camera={{ position: [0, 1.5, 4] }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[-10, 0, -5]} intensity={1} color="#ffffff" />
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

      <Bounds fit clip observe margin={1.5}>
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

      <OrbitControls makeDefault />
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
  return (
    <>
      <axesHelper />
      <group scale={[3, 3, 3]} ref={groupRef}>
        <Float
          position={[1, 0.3, -0.25]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={4}
          floatIntensity={3}
          speed={0.5}
        >
          <Sword />
        </Float>
        <Float
          position={[0, 0.1, 0.25]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={4}
          floatIntensity={3}
          speed={0.5}
        >
          <Coin />
        </Float>
        <Float
          position={[-1, 0, -0.25]}
          rotation={[0, 0, 0]}
          rotationIntensity={4}
          floatIntensity={3}
          speed={0.5}
        >
          <Flag />
        </Float>
      </group>
      <group rotation={[0, 0, 0]} position={[0, 0, 1]}>
        <Float
          rotationIntensity={0.5}
          rotation={[-Math.PI / 32, Math.PI / 4, Math.PI / 16]}
          position={[-3, 1.75, 0.5]}
        >
          <Text3D font="/fonts/Knewave_Regular.json">Never</Text3D>
        </Float>
        <Float
          rotationIntensity={0.5}
          position={[0.5, 1.5, 0.5]}
          rotation={[0, -Math.PI / 8, Math.PI / 32]}
        >
          <Text3D font="/fonts/Knewave_Regular.json">Lose</Text3D>
        </Float>
        <Float
          rotationIntensity={0.5}
          position={[-1, -0.5, 0.5]}
          rotation={[0, Math.PI / 16, Math.PI / 16]}
        >
          <Text3D font="/fonts/Knewave_Regular.json">Touch</Text3D>
        </Float>
      </group>
    </>
  );
}
