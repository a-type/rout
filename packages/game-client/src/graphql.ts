import type { introspection } from './graphql-env.d.js';
import { initGraphQLTada } from 'gql.tada';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    DateTime: string;
    Date: string;
    JSON: any;
  };
}>();
