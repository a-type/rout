import { PrefixedId } from './ids';

export type GameSessionChatMessage = {
  id: PrefixedId<'cm'>;
  createdAt: number;
  authorId: PrefixedId<'u'>;
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
};

export type GameSessionChatInit = Omit<
  GameSessionChatMessage,
  'id' | 'createdAt' | 'authorId'
>;
