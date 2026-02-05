import {
  blue,
  crimson,
  gray,
  indigo,
  lime,
  mint,
  orange,
  plum,
  red,
  teal,
  violet,
  yellow,
} from '@radix-ui/colors';

// this is verbose and manual, because color
// is pretty perceptively varied, so trying
// to abstract these would probably produce
// a bad experience

export type PlayerColorPalette = {
  range: string[];
  default: string;
  defaultText: string;
  okHue: number;
  okRotate: number;
  okSaturation: number;
};

/** supported player color palettes */
export const colors: Record<string, PlayerColorPalette> = {
  red: {
    range: [
      red.red1,
      red.red2,
      red.red3,
      red.red4,
      red.red5,
      red.red6,
      red.red7,
      red.red8,
      red.red9,
      red.red10,
      red.red11,
      red.red12,
    ],
    default: red.red9,
    defaultText: 'white',
    okHue: 23.9,
    okRotate: 1,
    okSaturation: 0.8,
  },
  crimson: {
    range: [
      crimson.crimson1,
      crimson.crimson2,
      crimson.crimson3,
      crimson.crimson4,
      crimson.crimson5,
      crimson.crimson6,
      crimson.crimson7,
      crimson.crimson8,
      crimson.crimson9,
      crimson.crimson10,
      crimson.crimson11,
      crimson.crimson12,
    ],
    default: crimson.crimson9,
    defaultText: 'white',
    okHue: 1.3,
    okRotate: -2,
    okSaturation: 0.8,
  },
  plum: {
    range: [
      plum.plum1,
      plum.plum2,
      plum.plum3,
      plum.plum4,
      plum.plum5,
      plum.plum6,
      plum.plum7,
      plum.plum8,
      plum.plum9,
      plum.plum10,
      plum.plum11,
      plum.plum12,
    ],
    default: plum.plum9,
    defaultText: 'white',
    okHue: 322.09,
    okRotate: 0,
    okSaturation: 0.8,
  },
  violet: {
    range: [
      violet.violet1,
      violet.violet2,
      violet.violet3,
      violet.violet4,
      violet.violet5,
      violet.violet6,
      violet.violet7,
      violet.violet8,
      violet.violet9,
      violet.violet10,
      violet.violet11,
      violet.violet12,
    ],
    default: violet.violet9,
    defaultText: 'white',
    okHue: 288.1,
    okRotate: 0,
    okSaturation: 0.8,
  },
  indigo: {
    range: [
      indigo.indigo1,
      indigo.indigo2,
      indigo.indigo3,
      indigo.indigo4,
      indigo.indigo5,
      indigo.indigo6,
      indigo.indigo7,
      indigo.indigo8,
      indigo.indigo9,
      indigo.indigo10,
      indigo.indigo11,
      indigo.indigo12,
    ],
    default: indigo.indigo9,
    defaultText: 'white',
    okHue: 267.08,
    okRotate: 0,
    okSaturation: 0.8,
  },
  blue: {
    range: [
      blue.blue1,
      blue.blue2,
      blue.blue3,
      blue.blue4,
      blue.blue5,
      blue.blue6,
      blue.blue7,
      blue.blue8,
      blue.blue9,
      blue.blue10,
      blue.blue11,
      blue.blue12,
    ],
    default: blue.blue9,
    defaultText: 'white',
    okHue: 251.81,
    okRotate: 0,
    okSaturation: 0.8,
  },
  teal: {
    range: [
      teal.teal1,
      teal.teal2,
      teal.teal3,
      teal.teal4,
      teal.teal5,
      teal.teal6,
      teal.teal7,
      teal.teal8,
      teal.teal9,
      teal.teal10,
      teal.teal11,
      teal.teal12,
    ],
    default: teal.teal9,
    defaultText: 'white',
    okHue: 170.01,
    okRotate: 4,
    okSaturation: 0.8,
  },
  lime: {
    range: [
      lime.lime1,
      lime.lime2,
      lime.lime3,
      lime.lime4,
      lime.lime5,
      lime.lime6,
      lime.lime7,
      lime.lime8,
      lime.lime9,
      lime.lime10,
      lime.lime11,
      lime.lime12,
    ],
    default: lime.lime9,
    defaultText: 'white',
    okHue: 126.09,
    okRotate: 0,
    okSaturation: 0.8,
  },
  orange: {
    range: [
      orange.orange1,
      orange.orange2,
      orange.orange3,
      orange.orange4,
      orange.orange5,
      orange.orange6,
      orange.orange7,
      orange.orange8,
      orange.orange9,
      orange.orange10,
      orange.orange11,
      orange.orange12,
    ],
    default: orange.orange9,
    defaultText: 'white',
    okHue: 44.8,
    okRotate: 0,
    okSaturation: 0.8,
  },
  yellow: {
    range: [
      yellow.yellow1,
      yellow.yellow2,
      yellow.yellow3,
      yellow.yellow4,
      yellow.yellow5,
      yellow.yellow6,
      yellow.yellow7,
      yellow.yellow8,
      yellow.yellow9,
      yellow.yellow10,
      yellow.yellow11,
      yellow.yellow12,
    ],
    default: yellow.yellow9,
    defaultText: 'black',
    okHue: 102.14,
    okRotate: 6,
    okSaturation: 0.8,
  },
  mint: {
    range: [
      mint.mint1,
      mint.mint2,
      mint.mint3,
      mint.mint4,
      mint.mint5,
      mint.mint6,
      mint.mint7,
      mint.mint8,
      mint.mint9,
      mint.mint10,
      mint.mint11,
      mint.mint12,
    ],
    default: mint.mint9,
    defaultText: 'black',
    okHue: 177.97,
    okRotate: 0,
    okSaturation: 0.8,
  },
  gray: {
    range: [
      gray.gray1,
      gray.gray2,
      gray.gray3,
      gray.gray4,
      gray.gray5,
      gray.gray6,
      gray.gray7,
      gray.gray8,
      gray.gray9,
      gray.gray10,
      gray.gray11,
      gray.gray12,
    ],
    default: gray.gray9,
    defaultText: 'black',
    okHue: 220,
    okRotate: 0,
    okSaturation: 0.2,
  },
};

export type PlayerColorName = keyof typeof colors;
export const colorNames = Object.keys(colors) as [
  PlayerColorName,
  ...PlayerColorName[],
];

export function deduplicatePlayerColors<P extends { color: PlayerColorName }>(
  players: P[],
): P[] {
  const usedColors = new Set<PlayerColorName>();
  const unusedColors = new Set<PlayerColorName>(colorNames);
  for (const player of players) {
    unusedColors.delete(player.color);
  }
  for (const player of players) {
    if (usedColors.has(player.color)) {
      // find the first unused color
      const newColor = unusedColors.values().next().value;
      if (newColor) {
        player.color = newColor;
        unusedColors.delete(player.color);
      }
    }
    usedColors.add(player.color);
  }
  return players;
}
