import type { Blessing } from '../gameDefinition.js';
import { colorLookup } from './terrain.js';

// https://24ways.org/2010/calculating-color-contrast
function getContrastYIQ(hexcolor: string) {
  var r = parseInt(hexcolor.slice(1, 3), 16);
  var g = parseInt(hexcolor.slice(3, 5), 16);
  var b = parseInt(hexcolor.slice(5, 7), 16);
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

function BlessingCard({ item }: { item: Blessing }) {
  const backgroundColor = colorLookup[item.location];
  return (
    <div
      className="flex flex-col gap-3 items-center justify-center"
      style={{
        // light if background color is dark, otherwise dark
        color: getContrastYIQ(backgroundColor),
        backgroundColor,
        width: 85,
        height: 100,
      }}
    >
      <span className="capitalize">{item.location}</span>
      <span className="font-bold text-xl">{item.points}</span>
    </div>
  );
}

function Blessings({ items }: { items: Blessing[] }) {
  return (
    <div className="flex flex-row gap-2">
      {items.map((item, idx) => (
        <BlessingCard key={idx} item={item} />
      ))}
    </div>
  );
}

export default Blessings;
