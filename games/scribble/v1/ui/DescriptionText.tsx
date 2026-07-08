import { Text } from '@a-type/ui';

export interface DescriptionTextProps {
  children: string;
}

export function DescriptionText({ children }: DescriptionTextProps) {
  return (
    <Text emphasis="primary" italic>
      "{children}"
    </Text>
  );
}
