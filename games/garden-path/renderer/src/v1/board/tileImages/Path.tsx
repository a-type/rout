export interface PathProps {
  path: string;
  dirt: string;
}

export function Path({ path, dirt }: PathProps) {
  return (
    <g>
      <path d={dirt} className="fill-main-dark stroke-main-dark stroke-5" />
      <path d={path} className="fill-white stroke-white stroke-3" />
    </g>
  );
}
