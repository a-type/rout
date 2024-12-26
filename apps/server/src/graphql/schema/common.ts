import { builder } from '../builder.js';

builder.objectType('Point', {
  fields: (t) => ({
    x: t.field({
      type: 'Int',
      resolve: (obj) => obj.x,
    }),
    y: t.field({
      type: 'Int',
      resolve: (obj) => obj.y,
    }),
  }),
});

builder.inputType('PointInput', {
  fields: (t) => ({
    x: t.int({
      required: true,
    }),
    y: t.int({
      required: true,
    }),
  }),
});
