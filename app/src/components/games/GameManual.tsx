import {
  Box,
  clsx,
  H1,
  H2,
  H3,
  H4,
  P,
  Spinner,
  withClassName,
} from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { fetch, queryClient, useSuspenseQuery } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { lazy } from 'react';
import type { Components } from 'react-markdown';

const LazyMarkdown = lazy(() => import('react-markdown'));

export interface GameManualProps {
  gameId: string;
}

export const GameManual = withSuspense(
  function GameManual({ gameId }: GameManualProps) {
    const { data: markdown } = useSuspenseQuery(
      {
        queryKey: ['gameManual', gameId],
        queryFn: async () => {
          const result = await fetch(`/game-data/${gameId}/rules.md`);
          if (!result.ok) {
            throw LongGameError.fromResponse(result);
          }
          return result.text();
        },
      },
      queryClient,
    );

    return (
      <Box d="col" gap="lg">
        <LazyMarkdown
          urlTransform={(url) => {
            const asUrl = new URL(url, window.location.href);
            asUrl.pathname = `/game-data/${gameId}${asUrl.pathname}`;
            return asUrl.toString();
          }}
          components={markdownComponents}
        >
          {markdown}
        </LazyMarkdown>
      </Box>
    );
  },
  <Spinner />,
);

const markdownComponents: Components = {
  a: ({ node, ...props }) => {
    return <Link {...props} to={props.href ?? '#'} />;
  },
  img: ({ node, className, ...props }) => {
    return (
      <Box full="width" layout="center center">
        <img
          {...props}
          className={clsx(
            'max-w-80% h-auto w-auto max-h-60vh rounded-lg mx-auto',
            className,
          )}
        />
      </Box>
    );
  },
  h1: withClassName(H1, 'font-fancy'),
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
};
