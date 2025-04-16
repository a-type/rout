import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@a-type/ui';
import games from '@long-game/games';

export interface GamePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  loading?: boolean;
}

export function GamePicker({
  value,
  onChange,
  loading,
  ...rest
}: GamePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger {...rest} loading={loading}>
        <SelectValue />
        <SelectIcon className="ml-auto" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(games).map(([gameId, game]) => (
          <SelectItem key={gameId} value={gameId}>
            {game.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
