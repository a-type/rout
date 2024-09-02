import { graphql } from '@long-game/graphql';

export const clientSessionFragment = graphql(`
  fragment GameDefinitionClientSession on GameSession {
    id
    gameId
    gameVersion
    startedAt
    createdAt
    updatedAt
    timezone
    status {
      status
      winnerIds
    }
    members {
      id
      status
      user {
        id
        isViewer
        name
        imageUrl
        color
      }
    }
  }
`);
