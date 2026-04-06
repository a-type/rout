import { perlin3d } from '@typegpu/noise';
import tgpu, { common, d } from 'typegpu';
import { abs, fract, fwidth, mix, mul, smoothstep } from 'typegpu/std';

export const root = await tgpu.init();

const perlinCacheConfig = perlin3d.dynamicCacheConfig();
const dynamicLayout = tgpu.bindGroupLayout({ ...perlinCacheConfig.layout });
const perlinCache = perlinCacheConfig.instance(root, d.vec3u(4, 4, 10));

export function createInstance() {
  const time = root.createUniform(d.f32, 0);
  const startColor = root.createUniform(d.vec3f, d.vec3f(1, 0, 0));
  const endColor = root.createUniform(d.vec3f, d.vec3f(0, 0, 1));
  const bgColor = root.createUniform(d.vec3f, d.vec3f(0, 0, 0));
  const speed = root.createUniform(d.f32, 1);
  const gridSize = root.createUniform(d.f32, 6);
  const pipeline = root
    .pipe(perlinCacheConfig.inject(dynamicLayout.$))
    .createRenderPipeline({
      vertex: common.fullScreenTriangle,
      fragment: (data) => {
        'use gpu';
        const uv = data.uv;
        const suv = mul(gridSize.$, uv);
        const v = perlin3d.sample(d.vec3f(suv, time.$ * speed.$));
        const stepped = smoothstep(
          12,
          0,
          abs(fract(v * 10.0) - 0.5) / fwidth(v),
        );

        const color = mix(
          d.vec4f(startColor.$, 1),
          d.vec4f(endColor.$, 1),
          v + 0.5,
        );
        return mix(d.vec4f(bgColor.$, 1), color, stepped * stepped);
      },
    });

  const bindGroup = root.createBindGroup(dynamicLayout, perlinCache.bindings);

  function updateColors(
    start: [number, number, number],
    end: [number, number, number],
    bg: [number, number, number],
  ) {
    startColor.write(d.vec3f(...start));
    endColor.write(d.vec3f(...end));
    bgColor.write(d.vec3f(...bg));
  }

  function updateSize(width: number, height: number) {
    gridSize.write(Math.max(Math.max(width, height) / 200, 1));
  }

  function bindCanvas(canvas: HTMLCanvasElement) {
    const context = root.configureContext({
      canvas,
      alphaMode: 'premultiplied',
      colorSpace: 'srgb',
    });
    let frameHandle: number;

    function draw(timestamp: number) {
      time.write((timestamp * 0.0002) / 10);
      pipeline.with(bindGroup).withColorAttachment({ view: context }).draw(3);
      frameHandle = requestAnimationFrame(draw);
    }

    frameHandle = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameHandle);
      context.unconfigure();
    };
  }

  return {
    updateColors,
    updateSize,
    bindCanvas,
  };
}
