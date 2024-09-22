import { useSubscription, useSuspenseQuery } from '@apollo/client';
import { graphql } from '@long-game/graphql';
import { useGameSessionId } from './useSessionId.js';
import { useGameSession } from './useGameSession.js';
import { useMemo } from 'react';

const chatFragment = graphql(`
  fragment ClientChat on ChatMessage @_unmask {
    id
    createdAt
    userId
    message
  }
`);

const gameChatQuery = graphql(
  `
    query GameChat($gameSessionId: ID!) {
      gameSession(id: $gameSessionId) {
        chat {
          messages {
            edges {
              node {
                id
                ...ClientChat
              }
            }
          }
        }
      }
    }
  `,
  [chatFragment],
);

const chatMessageSentSubscription = graphql(
  `
    subscription ChatMessageSent($gameSessionId: ID!) {
      chatMessageSent(gameSessionId: $gameSessionId) {
        ...ClientChat
      }
    }
  `,
  [chatFragment],
);

export function useChat() {
  const sessionId = useGameSessionId();
  const { data } = useSuspenseQuery(gameChatQuery, {
    variables: { gameSessionId: sessionId },
  });

  useSubscription(chatMessageSentSubscription, {
    variables: { gameSessionId: sessionId },
    onData: ({ client, data: { data } }) => {
      // append to game chat log
      const chat = client.readQuery({
        query: gameChatQuery,
        variables: { gameSessionId: sessionId },
      });
      if (!chat?.gameSession) return;
      if (!data?.chatMessageSent) return;
      const node = data.chatMessageSent;

      client.writeQuery({
        query: gameChatQuery,
        variables: { gameSessionId: sessionId },
        data: {
          gameSession: {
            ...chat.gameSession,
            chat: {
              ...chat.gameSession.chat,
              messages: {
                ...chat.gameSession.chat.messages,
                edges: [...chat.gameSession.chat.messages.edges, { node }],
              },
            },
          },
        },
      });
    },
  });

  return data.gameSession?.chat.messages.edges.map((edge) => edge.node) ?? [];
}

type ReplaceTurnData<Turn, ReplacedData> = {
  [K in keyof Turn]: K extends 'data' ? ReplacedData : Turn[K];
};
type ReplaceRoundTurnData<Round extends { turns: any[] }, Data> = {
  [K in keyof Round]: K extends 'turns'
    ? ReplaceTurnData<Round['turns'][number], Data>[]
    : Round[K];
};

export function usePriorRounds<T>() {
  const session = useGameSession();
  return session.state.rounds as ReplaceRoundTurnData<
    (typeof session.state.rounds)[number],
    T
  >[];
}

export function useCombinedLog<T>() {
  const chat = useChat();
  const rounds = usePriorRounds<T>();

  // interleave by timestamp
  return useMemo(() => {
    const combined = [
      ...chat.map((chat) => ({
        type: 'chat' as const,
        chatMessage: chat,
        timestamp: new Date(chat.createdAt),
      })),
      ...rounds.map((round) => ({
        type: 'round' as const,
        round,
        timestamp: new Date(round.turns[0].createdAt),
      })),
    ];
    combined.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    return combined;
  }, [chat, rounds]);
}
