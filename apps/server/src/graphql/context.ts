import { Session } from '@a-type/auth';
import { DB } from '@long-game/db';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';
import type { createDataLoaders } from './dataloaders.js';
import { PubSub } from 'graphql-subscriptions';

export type GQLContext = {
  session: Session | null;
  db: DB;
  hono: Context<Env>;
  dataLoaders: ReturnType<typeof createDataLoaders>;
  auth: {
    applyHeaders: Headers;
    setLoginSession: (session: Session) => Promise<void>;
  };
  pubsub: PubSub;
};
