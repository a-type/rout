import { Session } from '@a-type/auth';
import { DB, PrefixedId } from '@long-game/db';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';
import type { createDataLoaders } from './dataloaders.js';
import type { pubsub } from '../services/pubsub.js';

export type GQLContext = {
  session: (Omit<Session, 'userId'> & { userId: PrefixedId<'u'> }) | null;
  db: DB;
  hono: Context<Env>;
  dataLoaders: ReturnType<typeof createDataLoaders>;
  auth: {
    applyHeaders: Headers;
    setLoginSession: (session: Session) => Promise<void>;
  };
  pubsub: typeof pubsub;
};
