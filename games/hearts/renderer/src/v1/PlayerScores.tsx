import { Box, clsx, Tooltip } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  getCardRank,
  getCardSuit,
  getScore,
} from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar, PlayerName, usePlayerThemed } from '@long-game/game-ui';
import { PlayingCard } from '@long-game/game-ui/genericGames';
import { CardGrid } from './CardGrid';
import { hooks } from './gameClient';

export interface PlayerScoresProps {}

export const PlayerScores = hooks.withGame<PlayerScoresProps>(
  function PlayerScores({ gameSuite }) {
    return (
      <Box gap items="center" className="select-none">
        {gameSuite.members.map((member) => (
          <PlayerScore playerId={member.id} key={member.id} />
        ))}
      </Box>
    );
  },
);

const PlayerScore = hooks.withGame<{ playerId: PrefixedId<'u'> }>(
  function PlayerScore({ gameSuite, playerId }) {
    const { className, style } = usePlayerThemed(playerId);
    return (
      <Tooltip content={<PlayerScoredCards playerId={playerId} />}>
        <Box
          key={playerId}
          gap
          surface="primary"
          p="sm"
          d={{
            default: 'col',
            sm: 'row',
          }}
          className={clsx(
            'flex-[1_1_auto] items-start sm:items-center',
            className,
          )}
          style={style}
        >
          <Box gap items="center">
            <PlayerAvatar playerId={playerId} />
            <PlayerName playerId={playerId} />
          </Box>
          <PlayerScoreDisplay playerId={playerId} />
        </Box>
      </Tooltip>
    );
  },
);

const PlayerScoredCards = hooks.withGame<{ playerId: PrefixedId<'u'> }>(
  function PlayerScoredCards({ gameSuite, playerId }) {
    const scoredCards =
      gameSuite.viewingRound.initialPlayerState.scoredCards[playerId] ?? [];
    return (
      <CardGrid className="max-w-70vw">
        {scoredCards.map((card) => (
          <PlayingCard
            cardSuit={getCardSuit(card)}
            cardRank={getCardRank(card)}
            key={card}
            className="w-40px"
          />
        ))}
      </CardGrid>
    );
  },
);

const PlayerScoreDisplay = hooks.withGame<{ playerId: PrefixedId<'u'> }>(
  function PlayerScoreDisplay({ gameSuite, playerId }) {
    const playerBaseScore =
      gameSuite.viewingRound.initialPlayerState.scores[playerId];
    const playerRoundScore = getScore(
      gameSuite.viewingRound.initialPlayerState.scoredCards[playerId] ?? [],
    );
    return (
      <Box className="font-bold">
        {playerBaseScore}
        {` + `}
        {playerRoundScore}
      </Box>
    );
  },
);
