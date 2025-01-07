import { graphql } from '@long-game/game-client';

export const meQuery = graphql(`
  query Me {
    me {
      name
      color
    }
  }
`);
