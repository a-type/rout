import {
  Button,
  ButtonProps,
  ErrorBoundary,
  getColorMode,
  subscribeToColorModeChange,
  useSize,
  withClassName,
} from '@a-type/ui';
import { shaderMaterial } from '@react-three/drei';
import {
  Canvas,
  extend,
  useFrame,
  type ThreeElement,
} from '@react-three/fiber';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Color, ShaderMaterial } from 'three';
import { proxy } from 'valtio';

export interface TopographyProps {
  background?: number;
  gradient?: [number, number];
  speed?: number;
  className?: string;
}

function resolveColor(color: number): Color {
  return new Color(color);
}

const TopographyMaterial = shaderMaterial(
  {
    uTime: 0,
    uStartColor: new Color(),
    uEndColor: new Color(),
    uBGColor: new Color(),
    uScale: 1,
    uSpeed: 1,
  },
  // vertex shader (default)
  `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
  // fragment shader
  `
#include <common>
uniform float uTime;
uniform vec3 uStartColor;
uniform vec3 uEndColor;
uniform vec3 uBGColor;
uniform float uScale;
uniform float uSpeed;

uint hash(uint x) {
    x ^= x >> 16;
    x *= 0x21f0aaadu;
    x ^= x >> 15;
    x *= 0xd35a2d97u;
    x ^= x >> 15;
    return x;
}

float u2f(uint x) {
    return uintBitsToFloat(0x40000000u | (x & 0x007FFFFFu)) - 3.;
}

vec3 rand_grad(uvec3 p) {
    uint tmp = hash(hash(hash(hash(p.x)) ^ hash(p.y)) ^ hash(p.z));
    return vec3(u2f(hash(tmp ^ 0u)), u2f(hash(tmp ^ 1u)), u2f(hash(tmp ^ 2u)));
}

mat2 rotmat(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c,s,-s,c);
}

float perlin(vec3 p) {
    p.xz *= rotmat(1.2);
    p.xy *= rotmat(-3.2);
    p.xz *= rotmat(6.2);

    uvec3 ip = uvec3(ivec3(floor(p)));
    vec3 fp = p - floor(p);

    vec3 wa = fp*fp*fp*(fp*(fp*6.-15.)+10.);
    vec3 wb = 1. - wa;

    float res = 0.;
    res += dot(rand_grad(ip+uvec3(0,0,0)), fp-vec3(0,0,0)) * wb.x*wb.y*wb.z;
    res += dot(rand_grad(ip+uvec3(1,0,0)), fp-vec3(1,0,0)) * wa.x*wb.y*wb.z;
    res += dot(rand_grad(ip+uvec3(0,1,0)), fp-vec3(0,1,0)) * wb.x*wa.y*wb.z;
    res += dot(rand_grad(ip+uvec3(1,1,0)), fp-vec3(1,1,0)) * wa.x*wa.y*wb.z;
    res += dot(rand_grad(ip+uvec3(0,0,1)), fp-vec3(0,0,1)) * wb.x*wb.y*wa.z;
    res += dot(rand_grad(ip+uvec3(1,0,1)), fp-vec3(1,0,1)) * wa.x*wb.y*wa.z;
    res += dot(rand_grad(ip+uvec3(0,1,1)), fp-vec3(0,1,1)) * wb.x*wa.y*wa.z;
    res += dot(rand_grad(ip+uvec3(1,1,1)), fp-vec3(1,1,1)) * wa.x*wa.y*wa.z;
    return res;
}

void main() {
	float v = perlin(vec3(gl_FragCoord.xy * uScale / 100.0, uTime * uSpeed * 0.02));
	float mag = smoothstep(12., 0., abs(fract(v*10.0)-0.5)/fwidth(v));
	vec4 color = mix(vec4(uStartColor,1.0), vec4(uEndColor,1.0), v+0.5);

	gl_FragColor = mix(vec4(uBGColor,1.0), color, mag * mag);
  // gl_FragColor = vec4(uStartColor, 1.0);
}
`,
) as unknown as typeof ShaderMaterial & {
  uTime: number;
  uStartColor: Color;
  uEndColor: Color;
  uBGColor: Color;
  uScale: number;
  uSpeed: number;
  key: string;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    topographyMaterial: ThreeElement<typeof TopographyMaterial>;
  }
}

extend({ TopographyMaterial });

const COLORS = {
  light: {
    background: 0xfffaff,
    gradient: [0xff9fff, 0xa0a0ff],
  },
  dark: {
    background: 0x29196e,
    gradient: [0x622862, 0xb3b1d0],
  },
};

export function Topography({ className, ...rest }: TopographyProps) {
  const [state] = useState(() => proxy({ scale: 1 }));
  const ref = useSize<HTMLDivElement>(({ width, height }) => {
    state.scale = Math.max(0, (2000 - Math.max(width, height)) / 1000) * 0.5;
  });

  const mode = useSyncExternalStore(subscribeToColorModeChange, () =>
    getColorMode(),
  );
  const resolvedMode =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  const backgroundCss = rest.background ?? COLORS[resolvedMode].background;
  const background = resolveColor(backgroundCss);
  const gradient = (rest.gradient ?? COLORS[resolvedMode].gradient).map(
    resolveColor,
  ) as [Color, Color];

  return (
    <div className={className} style={{ background: backgroundCss }} ref={ref}>
      <ErrorBoundary fallback={null}>
        <Canvas
          className="animate-fade-in animate-duration-1s"
          orthographic
          gl={{
            antialias: true,
          }}
          flat
          camera={{
            zoom: 1,
            position: [0, 0, 1],
            left: -1,
            right: 1,
            top: 1,
            bottom: -1,
            near: -1,
            far: 1,
          }}
        >
          <color attach="background" args={[background]} />
          <TopographyMesh
            {...rest}
            background={background}
            gradient={gradient}
            state={state}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

function TopographyMesh({
  background: uBGColor,
  gradient: [uStartColor, uEndColor],
  speed: uSpeed,
  state,
}: {
  state: { scale: number };
  speed?: number;
  background: Color;
  gradient: [Color, Color];
}) {
  const materialRef = useRef<typeof TopographyMaterial>(null);

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;

    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
      materialRef.current.uScale = state.scale;
      materialRef.current.uStartColor = uStartColor;
      materialRef.current.uEndColor = uEndColor;
      materialRef.current.uBGColor = uBGColor;
    }
  });

  return (
    <mesh>
      <topographyMaterial
        key={TopographyMaterial.key}
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          uStartColor: { value: uStartColor },
          uEndColor: { value: uEndColor },
          uBGColor: { value: uBGColor },
          uScale: { value: 1 },
          uSpeed: { value: uSpeed ?? 1 },
        }}
      />
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export const TopographyBackground = withClassName(
  Topography,
  'absolute inset-0 z-0',
);

export const TopographyButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      color="primary"
      className="relative z-10 overflow-hidden"
    >
      {!props.disabled && (
        <TopographyBackground className="[:hover>&]:[filter:brightness(1.5)]" />
      )}
      <div className="relative z-1 flex flex-row gap-2 items-center">
        {children}
      </div>
    </Button>
  );
};
