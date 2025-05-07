import { z } from 'zod';
import { idShapes } from './ids';

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
    .describe(
      "If specified, this message should only be visible to other players *after* the indicated round. This puts the chat message in the same class of data as, say, turns: information about the game state which shouldn't be revealed until all players have moved forward. A -1 value indicates the message should only be visible after the game is over.",
    ),
  metadata: z
    .any()
    .optional()
    .describe(
      'Can be whatever you want. Each game can utilize this field as it sees fit.',
    ),
  reactions: chatReactionsShape,
});
export type GameSessionChatMessage = z.infer<
  typeof gameSessionChatMessageShape
>;

export const gameSessionChatInitShape = gameSessionChatMessageShape.omit({
  id: true,
  createdAt: true,
  authorId: true,
  reactions: true,
});
export type GameSessionChatInit = z.infer<typeof gameSessionChatInitShape>;

export type SystemChatAuthorId = typeof SYSTEM_CHAT_AUTHOR_ID;
