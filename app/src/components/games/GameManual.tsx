import { Box, clsx, H1, H2, H3, H4, P, withClassName } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { fetch } from '@long-game/game-client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@verdant-web/react-router';
import Markdown, { Components } from 'react-markdown';

export interface GameManualProps {
  gameId: string;
}

export function GameManual({ gameId }: GameManualProps) {
  const { data: markdown } = useSuspenseQuery({
    queryKey: ['gameManual', gameId],
    queryFn: async () => {
      const result = await fetch(`/game-data/${gameId}/rules.md`);
      if (!result.ok) {
        throw LongGameError.fromResponse(result);
      }
      return result.text();
    },
  });

  return (
    <Box d="col" gap="lg">
      <Markdown
        urlTransform={(url) => {
          const asUrl = new URL(url, window.location.href);
          asUrl.pathname = `/game-data/${gameId}${asUrl.pathname}`;
          return asUrl.toString();
        }}
        components={markdownComponents}
      >
        {markdown}
      </Markdown>
    </Box>
  );
}

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
