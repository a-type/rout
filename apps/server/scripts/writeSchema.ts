import { writeSchema } from '../src/tasks/writeSchema.js';
writeSchema();
console.log(
  'Wrote schema to apps/server/schema.graphql',
  new Date().toISOString(),
);
