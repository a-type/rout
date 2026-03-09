import { serializeTile } from '@long-game/game-gridlock-definition/v1';
import Dir0 from './Directions0.js';
import Dir1 from './Directions1.js';
import Dir2 from './Directions2.js';
import Dir2_1 from './Directions2Straight.js';
import Dir3 from './Directions3.js';
import Dir4 from './Directions4.js';

export const tileImages = {
  // dir = 0
  [serializeTile({
    up: false,
    down: false,
    left: false,
    right: false,
  })]: {
    Component: Dir0,
    rotation: 0,
  },
  // dir = 1
  [serializeTile({
    up: true,
    down: false,
    left: false,
    right: false,
  })]: {
    Component: Dir1,
    rotation: 180,
  },
  [serializeTile({
    up: false,
    down: true,
    left: false,
    right: false,
  })]: {
    Component: Dir1,
    rotation: 0,
  },
  [serializeTile({
    up: false,
    down: false,
    left: true,
    right: false,
  })]: {
    Component: Dir1,
    rotation: 90,
  },
  [serializeTile({
    up: false,
    down: false,
    left: false,
    right: true,
  })]: {
    Component: Dir1,
    rotation: 270,
  },
  // dir = 2
  [serializeTile({
    up: true,
    down: true,
    left: false,
    right: false,
  })]: {
    Component: Dir2_1,
    rotation: 0,
  },
  [serializeTile({
    up: false,
    down: false,
    left: true,
    right: true,
  })]: {
    Component: Dir2_1,
    rotation: 90,
  },
  [serializeTile({
    up: true,
    down: false,
    left: true,
    right: false,
  })]: {
    Component: Dir2,
    rotation: 180,
  },
  [serializeTile({
    up: true,
    down: false,
    left: false,
    right: true,
  })]: {
    Component: Dir2,
    rotation: 270,
  },
  [serializeTile({
    up: false,
    down: true,
    left: true,
    right: false,
  })]: {
    Component: Dir2,
    rotation: 90,
  },
  [serializeTile({
    up: false,
    down: true,
    left: false,
    right: true,
  })]: {
    Component: Dir2,
    rotation: 0,
  },
  // dir = 3
  [serializeTile({
    up: true,
    down: true,
    left: true,
    right: false,
  })]: {
    Component: Dir3,
    rotation: 90,
  },
  [serializeTile({
    up: true,
    down: true,
    left: false,
    right: true,
  })]: {
    Component: Dir3,
    rotation: 270,
  },
  [serializeTile({
    up: true,
    down: false,
    left: true,
    right: true,
  })]: {
    Component: Dir3,
    rotation: 180,
  },
  [serializeTile({
    up: false,
    down: true,
    left: true,
    right: true,
  })]: {
    Component: Dir3,
    rotation: 0,
  },
  // dir = 4
  [serializeTile({
    up: true,
    down: true,
    left: true,
    right: true,
  })]: {
    Component: Dir4,
    rotation: 0,
  },
};
