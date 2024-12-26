import { builder } from './builder.js';
import './schema/chat.js';
import './schema/common.js';
import './schema/friendship.js';
import './schema/gameSession.js';
import './schema/gameSessionMembership.js';
import './schema/gameSessionState.js';
import './schema/scalars.js';
import './schema/turns.js';
import './schema/user.js';

builder.queryType({});
builder.mutationType({});
builder.subscriptionType({});

export const schema = builder.toSchema();
