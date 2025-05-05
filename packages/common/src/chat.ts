import { PrefixedId } from './ids';

export type GameSessionChatMessage = {
  id: PrefixedId<'cm'>;
  createdAt: string;
  authorId: PrefixedId<'u'> | SystemChatAuthorId;
  content: string;
  /**
   * Optionally, chats can be placed on a game scene
   */
  position?: { x: number; y: number };
  /**
   * If specified, positioned chats should only be visible
   * on the game scene that matches this ID. Game scene IDs
   * are arbitrary and determined (and interpreted) by the game.
   */
  sceneId?: string;
  /**
   * If specified, this message should only be delivered
   * to these recipients.
   */
  recipientIds?: PrefixedId<'u'>[];
  /**
   * If specified, this message should only be visible
   * to other players *after* the indicated round. This puts
   * the chat message in the same class of data as, say, turns:
   * information about the game state which shouldn't be revealed
   * until all players have moved forward.
   *
   * A -1 value indicates the message should only be visible
   * after the game is over.
   */
  roundIndex: number;
  /**
   * Can be whatever you want. Each game can utilize this field
   * as it sees fit.
   */
  metadata?: any;
};

export type GameSessionChatInit = Omit<
  GameSessionChatMessage,
  'id' | 'createdAt' | 'authorId'
>;

export const SYSTEM_CHAT_AUTHOR_ID = 'system' as const;
export type SystemChatAuthorId = typeof SYSTEM_CHAT_AUTHOR_ID;
