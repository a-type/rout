import { CardDefinition } from '../gameDefinition.js';

// https://24ways.org/2010/calculating-color-contrast
function getContrastYIQ(hexcolor: string) {
  var r = parseInt(hexcolor.slice(1, 3), 16);
  var g = parseInt(hexcolor.slice(3, 5), 16);
  var b = parseInt(hexcolor.slice(5, 7), 16);
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

function Card({ name, description, color = '#444', tags }: CardDefinition) {
  return (
    <div
      className="flex flex-col gap-3 items-center justify-center border border-solid border-white rounded-md p-1"
      style={{
        // light if background color is dark, otherwise dark
        color: getContrastYIQ(color),
        backgroundColor: color,
        width: 110,
        height: 150,
      }}
    >
      <span className="capitalize font-semibold">{name}</span>
      {tags ? (
        <div className="flex flex-row gap-1 text-xs">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="p-1 rounded-md"
              style={{ backgroundColor: 'black', color: 'white' }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="text-xs">{description}</span>
    </div>
  );
}

export default Card;
