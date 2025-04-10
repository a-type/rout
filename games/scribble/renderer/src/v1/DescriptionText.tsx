export interface DescriptionTextProps {
  children: string;
}

export function DescriptionText({ children }: DescriptionTextProps) {
  return <div className="text-2xl italic">"{children}"</div>;
}
