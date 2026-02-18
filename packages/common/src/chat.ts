import { z } from 'zod';
import { idShapes, PrefixedId } from './ids.js';

export const SYSTEM_CHAT_AUTHOR_ID = 'system' as const;

export const chatReactionsShape = z
  .record(z.string(), z.array(idShapes.User))
  .describe(
    'A map of emoji to player IDs. This is used to track reactions to chat messages.',
  );
export type ChatReactions = z.infer<typeof chatReactionsShape>;

export const chatPositionShape = z.object({
  x: z.number(),
  y: z.number(),
});
export type ChatPosition = z.infer<typeof chatPositionShape>;

export const chatRecipientIdsShape = z
  .array(idShapes.User)
  .describe(
    'If specified, this message should only be delivered to these recipients.',
  );

export const gameSessionChatMessageShape = z.object({
  id: idShapes.ChatMessage,
  createdAt: z.string(),
  authorId: z.union([idShapes.User, z.literal(SYSTEM_CHAT_AUTHOR_ID)]),
  content: z.string().describe('The text of the chat message'),
  position: chatPositionShape
    .optional()
    .describe('Optionally, chats can be placed on a game scene'),
  sceneId: z
    .string()
    .optional()
    .describe(
      'If specified, positioned chats should only be visible on the game scene that matches this ID. Game scene IDs are arbitrary and determined (and interpreted) by the game.',
    ),
  recipientIds: chatRecipientIdsShape
    .optional()
    .describe(
      'If specified, this message should only be delivered to these recipients.',
    ),
  roundIndex: z
    .number()
    .optional()
    .default(0)
    .describe(
      `If specified, this message should only be visible to other players *on or after* the indicated round.
      This puts the chat message in the same class of data as, say, turns: information about the game state which shouldn't be revealed until all players have moved forward.
      A -1 value indicates the message should only be visible after the game is over.`,
    ),
  metadata: z
    .any()
    .optional()
    .describe(
      'Can be whatever you want. Each game can utilize this field as it sees fit.',
    ),
  reactions: chatReactionsShape.optional().default({}),
  type: z
    .enum(['chat', 'game-vote'])
    .optional()
    .default('chat')
    .describe(
      'The type of chat message. This can be used to distinguish between normal chat messages, which a game can control, and special messages which should be interpreted by the system.',
    ),
});
export type GameSessionChatMessage = z.infer<
  typeof gameSessionChatMessageShape
>;

export const gameSessionChatInitShape = gameSessionChatMessageShape.omit({
  id: true,
  createdAt: true,
  reactions: true,
  type: true,
});
export type GameSessionChatInit = z.infer<typeof gameSessionChatInitShape>;

export type SystemChatAuthorId = typeof SYSTEM_CHAT_AUTHOR_ID;

export const chatTokens = {
  gameTitle: (gameId: string) => `{{!game:${gameId}:title}}`,
  playerHandle: (playerId: PrefixedId<'u'>) => `{{!player:${playerId}:handle}}`,
};
export const chatTokenRegex = /\{\{!(\w+):([^:]+):([^}]+)\}\}/g;
export interface ParsedChatToken {
  type: string;
  value: string;
  role: string;
}
export function splitChatTokens(text: string) {
  const parts: (string | ParsedChatToken)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = chatTokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [_, type, value, role] = match;
    parts.push({ type, value, role });
    lastIndex = chatTokenRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
