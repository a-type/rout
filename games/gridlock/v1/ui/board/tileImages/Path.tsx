import cls from './images.module.css';

export interface PathProps {
  path: string;
  dirt: string;
}

export function Path({ path, dirt }: PathProps) {
  return (
    <g>
      <path d={dirt} className={cls.pathOuter} />
      <path d={path} className={cls.pathInner} />
    </g>
  );
}
