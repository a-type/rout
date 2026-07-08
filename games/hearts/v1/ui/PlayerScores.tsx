import { Box, clsx, HorizontalList, Text } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { PlayerAvatar, PlayerName, usePlayerThemed } from '@long-game/game-ui';
import { getScore, losingScore } from '../definition/index';
import { hooks } from './gameClient.js';
import { PlayerScoredCards } from './PlayerScoredCards.js';
import cls from './PlayerScores.module.css';

export interface PlayerScoresProps {
  className?: string;
}

export const PlayerScores = hooks.withGame<PlayerScoresProps>(
  function PlayerScores({ gameSuite, className }) {
    return (
      <Box col className={clsx('select-none overflow-y-auto', className)}>
        <Box layout="center between" className={cls.label}>
          <div>Scores</div>
          <div>(play to {losingScore})</div>
        </Box>
        <div className={cls.grid}>
          {gameSuite.finalState.playerOrder.map((playerId) => (
            <PlayerScore playerId={playerId} key={playerId} />
          ))}
        </div>
      </Box>
    );
  },
);

const PlayerScore = hooks.withGame<{ playerId: PrefixedId<'u'> }>(
  function PlayerScore({ gameSuite, playerId }) {
    const { className, style } = usePlayerThemed(playerId);
    const isMe = gameSuite.playerId === playerId;
    return (
      <Box
        surface
        p={false}
        className={clsx(cls.playerScore, '@mode-user', className)}
        style={style}
        border={isMe}
      >
        <Box
          gap="sm"
          items="center"
          className={clsx('@mode-dense', cls.playerHeader)}
        >
          <PlayerAvatar playerId={playerId} size={16} />
          <PlayerName playerId={playerId} />
        </Box>
        <HorizontalList
          className={cls.cardList}
          contentClassName={cls.cardListContent}
          openDirection="down"
        >
          <PlayerScoreDisplay
            playerId={playerId}
            className={cls.scoreDisplay}
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
    <Text bold wrap={false} className={className} {...rest}>
      {playerBaseScore}
      {` + `}
      {playerRoundScore}
    </Text>
  );
});
