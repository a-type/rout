import { CanvasProps, createRoot, events, useFrame } from '@react-three/fiber';
import * as React from 'react';

// Make sure renderer is in sync with canvas
function WithSize({ children }: { children?: React.ReactNode }) {
  useFrame((state) => {
    if (!state.gl.domElement?.parentElement) return;

    const { clientWidth, clientHeight } = state.gl.domElement.parentElement;
    if (
      state.size.width !== clientWidth &&
      state.size.height !== clientHeight
    ) {
      state.setSize(clientWidth, clientHeight);
    }
  });

  return children ?? null;
}

export function StrictSizeCanvas({ children, style, ...props }: CanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Execute JSX in the reconciler as a layout-effect
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const root = createRoot(canvasRef.current!);
    root.configure({ ...props, events });
    root.render(<WithSize>{children}</WithSize>);

    return () => {
      root.unmount();
    };
  }, [children, props]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
