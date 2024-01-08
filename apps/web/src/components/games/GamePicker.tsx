import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@a-type/ui/components/select';
import { gameDefinitions } from '@long-game/games';

export interface GamePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export function GamePicker({ value, onChange, ...rest }: GamePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger {...rest}>
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(gameDefinitions).map(([gameId, gameDefinition]) => (
          <SelectItem key={gameId} value={gameId}>
            {gameDefinition.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
