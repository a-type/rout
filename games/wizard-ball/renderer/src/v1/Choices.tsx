import { useEffect, useState } from 'react';
import { hooks } from './gameClient';
import { ItemDefChip } from './items/ItemChip';
import { clsx, Button } from '@a-type/ui';
import { Choice as ChoiceType } from '@long-game/game-wizard-ball-definition';
import { PlayerChip } from './players/PlayerChip';
import { shortAttribute } from './utils';
import { PerkChip } from './perks/PerkChip';

function Choice({ choice }: { choice: ChoiceType }) {
  if (choice.kind === 'item') {
    return (
      <>
        <span className="text-sm font-semibold">Gain </span>
        <ItemDefChip id={choice.itemDefId} />
      </>
    );
  }
  if (choice.kind === 'perk') {
    return (
      <>
        <span className="text-sm font-semibold">
          <PlayerChip id={choice.playerId} />
        </span>
        <span className="font-normal">gains</span>
        <PerkChip id={choice.perkId} />
      </>
    );
  }
  if (choice.kind === 'attributeBoost') {
    const { amount, attribute } = choice;
    return (
      <>
        <span className="text-sm font-semibold">
          <PlayerChip id={choice.playerId} />{' '}
        </span>
        <span className="font-normal">gains</span>
        <span
          className={clsx(
            'text-sm uppercase',
            amount > 0 ? 'text-green-500' : 'text-red-500',
          )}
        >
          {amount > 0 ? '+' : ''}
          {amount} {shortAttribute(attribute)}
        </span>
      </>
    );
  }
  if (choice.kind === 'teamBoost') {
    const { amount, attribute } = choice;
    return (
      <>
        <span className="text-sm font-semibold">ENTIRE TEAM</span>
        <span className="font-normal">gains</span>
        <span
          className={clsx(
            'text-sm uppercase',
            amount > 0 ? 'text-green-500' : 'text-red-500',
          )}
        >
          {amount > 0 ? '+' : ''}
          {amount} {shortAttribute(attribute)}
        </span>
      </>
    );
  }
  return <span className="text-sm font-semibold">Unknown choice kind</span>;
}

export function Choices() {
  const { finalState, prepareTurn, localTurnData } = hooks.useGameSuite();
  const [selection, setSelection] = useState<string>(
    localTurnData?.choiceId ?? '',
  );
  useEffect(() => {});
  useEffect(() => {
    if (selection) {
      prepareTurn((turn) => ({ ...turn, choiceId: selection }));
    }
  }, [selection]);
  const options = finalState.choices;
  if (!options || options.length === 0) {
    return <div className="text-gray-500">No choices available.</div>;
  }
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold mb-2">Choose a boon!</h2>
      <div className="flex flex-row gap-2">
        {options.map((choice) => {
          return (
            <Button
              onClick={() => {
                setSelection(choice.id);
              }}
              key={choice.id}
              className={clsx(
                'flex flex-col gap-2 items-center justify-between bg-gray-800 px-2 py-4 rounded border-none',
                selection === choice.id
                  ? 'outline outline-4 outline-blue-500'
                  : '',
              )}
            >
              <Choice choice={choice} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
