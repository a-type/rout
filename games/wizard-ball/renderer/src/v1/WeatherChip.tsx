import {
  weather as weatherData,
  type WeatherType,
} from '@long-game/game-wizard-ball-definition';
import { PerkEffect } from './items/PerkEffect';
import { TooltipPlus } from './TooltipPlus';

export function WeatherChip({ id }: { id: WeatherType }) {
  const weather = weatherData[id];

  if (!weather) {
    return <span className="color-attention-dark">Unknown Weather</span>;
  }
  const { color, icon, name } = weather;
  return (
    <TooltipPlus
      content={
        <div className="flex flex-col gap-1">
          <span>{weather.description}</span>
          <PerkEffect effect={weather.effect()} />
        </div>
      }
      className="bg-gray-wash color-gray-ink max-w-[400px]"
    >
      <span
        className="flex flex-row items-center bg-gray-wash border-solid border-1 p-1 rounded cursor-pointer hover:bg-gray-wash"
        style={{
          borderColor: color,
          color: color,
        }}
      >
        {icon} {name}
      </span>
    </TooltipPlus>
  );
}
