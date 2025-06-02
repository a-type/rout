import { Tooltip } from '@a-type/ui';
import {
  weather as weatherData,
  type WeatherType,
} from '@long-game/game-wizard-ball-definition';

export function WeatherChip({ id }: { id: WeatherType }) {
  const weather = weatherData[id];

  if (!weather) {
    return <span className="text-red-500">Unknown Weather</span>;
  }
  const { color, icon, name } = weather;
  return (
    <Tooltip
      content={weather.description}
      className="bg-gray-700 text-gray-100 max-w-[400px]"
    >
      <span
        className="flex flex-row items-center bg-gray-700 border-solid border-1 p-1 rounded cursor-pointer hover:bg-gray-700"
        style={{
          borderColor: color,
          color: color,
        }}
      >
        {icon} {name}
      </span>
    </Tooltip>
  );
}
