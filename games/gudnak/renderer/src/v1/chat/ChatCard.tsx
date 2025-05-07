import { cardDefinitions } from '@long-game/game-gudnak-definition';
import { hooks } from '../gameClient';
import { ValidCardId } from '@long-game/game-gudnak-definition/v1';
import { cardImageLookup } from '../cardImageLookup';
import { clsx, Tooltip } from '@a-type/ui';

export function ChatCard({ instanceId }: { instanceId: string }) {
  const { finalState, playerId: myPlayerId } = hooks.useGameSuite();

  const cardInfo = finalState.cardState[instanceId] ?? null;
  const friendly = cardInfo.ownerId === myPlayerId;
  const cardDef = cardDefinitions[cardInfo.cardId as ValidCardId];
  const name = cardDef?.name ?? 'Unknown Card';
  const image = cardImageLookup[finalState.cardState[instanceId].cardId];

  return (
    <Tooltip
      key={`card-${instanceId}`}
      content={<img className="max-w-[300px]" src={image} />}
    >
      <span
        className={clsx(
          'cursor-pointer',
          friendly ? 'text-blue-500' : 'text-red-500',
        )}
      >
        {name}
      </span>
    </Tooltip>
  );
}
