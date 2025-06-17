import { Box, clsx, HorizontalList, ScrollArea } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { getScore } from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar, PlayerName, usePlayerThemed } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { PlayerScoredCards } from './PlayerScoredCards';

export interface PlayerScoresProps {
  className?: string;
}

export const PlayerScores = hooks.withGame<PlayerScoresProps>(
  function PlayerScores({ gameSuite, className }) {
    return (
      <ScrollArea className={clsx('select-none', className)}>
        <div className="text-xs text-bold color-gray-dark mb-sm">Scores</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-sm items-start">
          {gameSuite.finalState.playerOrder.map((playerId) => (
            <PlayerScore playerId={playerId} key={playerId} />
          ))}
        </div>
      </ScrollArea>
    );
  },
);

const PlayerScore = hooks.withGame<{ playerId: PrefixedId<'u'> }>(
  function PlayerScore({ gameSuite, playerId }) {
    const { className, style } = usePlayerThemed(playerId);
    const isMe = gameSuite.playerId === playerId;
    return (
      <Box
        surface="primary"
        p="none"
        className={clsx(className)}
        style={style}
        border={isMe}
      >
        <Box
          gap="sm"
          items="center"
          className="text-nowrap text-xxs absolute top-sm left-md z-1"
        >
          <PlayerAvatar playerId={playerId} size={16} />
          <PlayerName playerId={playerId} />
        </Box>
        <HorizontalList
          className="rounded-lg mt-sm mb-0"
          contentClassName="gap-xs"
        >
          <PlayerScoreDisplay
            playerId={playerId}
            className="sticky left-0 my-auto mr-md z-1 bg-inherit"
          />
          <PlayerScoredCards playerId={playerId} />
        </HorizontalList>
      </Box>
    );
  },
);

const PlayerScoreDisplay = hooks.withGame<{
  playerId: PrefixedId<'u'>;
  className?: string;
}>(function PlayerScoreDisplay({ gameSuite, playerId, className, ...rest }) {
  const playerBaseScore =
    gameSuite.viewingRound.initialPlayerState.scores[playerId];
  const playerRoundScore = getScore(
    gameSuite.viewingRound.initialPlayerState.scoredCards[playerId] ?? [],
  );
  return (
    <Box className={clsx('font-bold text-nowrap', className)} {...rest}>
      {playerBaseScore}
      {` + `}
      {playerRoundScore}
    </Box>
  );
});
