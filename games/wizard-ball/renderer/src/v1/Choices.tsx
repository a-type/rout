import { useEffect, useState } from 'react';
import { hooks } from './gameClient';
import { ItemDefChip } from './items/ItemChip';
import { clsx, Button } from '@a-type/ui';
import { Choice as ChoiceType } from '@long-game/game-wizard-ball-definition';
import { PlayerChip } from './players/PlayerChip';
import { useSendTurn, shortAttribute } from './utils';
import { PerkChip } from './perks/PerkChip';

export function Choice({ choice }: { choice: ChoiceType }) {
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
  const { finalState, currentTurn } = hooks.useGameSuite();
  const sendTurn = useSendTurn();
  const [selection, setSelection] = useState<string>(
    currentTurn?.choiceId ?? '',
  );
  useEffect(() => {
    if (selection) {
      sendTurn((turn) => ({ ...turn, choiceId: selection }));
    }
  }, [selection]);
  const options = finalState.choices;
  if (!options || options.length === 0) {
    return <div className="text-gray-500">No choices available.</div>;
  }
  return (
    <div className="mb-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold mb-0">Choose a boon!</h2>
        <span className="text-sm text-gray-500">
          Select one of the following options to improve your team.
        </span>
      </div>
      <div className="flex flex-row gap-2 flex-wrap">
        {options.map((choice) => {
          return (
            <Button
              onClick={() => {
                setSelection(choice.id);
              }}
              key={choice.id}
              className={clsx(
                'flex flex-row md:flex-col gap-2 items-center justify-between bg-gray-800 px-2 py-4 rounded border-none',
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

export function LevelupChoices({ id }: { id: string }) {
  const { finalState, currentTurn } = hooks.useGameSuite();
  const sendTurn = useSendTurn();
  const [selection, setSelection] = useState<string[]>(
    currentTurn?.levelupChoices?.[id] ?? [],
  );
  useEffect(() => {
    if (selection?.length > 0) {
      sendTurn((turn) => ({
        ...turn,
        levelupChoices: { ...turn?.levelupChoices, [id]: selection },
      }));
    }
  }, [selection]);
  const optionsGroups = finalState.levelups[id];
  if (!optionsGroups || optionsGroups.length === 0) {
    return <div className="text-gray-500">No choices available.</div>;
  }
  return (
    <div className="my-4 flex flex-col gap-4">
      {optionsGroups.map((options, idx) => (
        <div className="flex flex-row gap-2 flex-wrap" key={idx}>
          {options.map((choice) => {
            return (
              <Button
                onClick={() => {
                  setSelection((v) =>
                    // update choice with index
                    v[idx] === choice.id
                      ? v.filter((c) => c !== choice.id)
                      : [...v.slice(0, idx), choice.id, ...v.slice(idx + 1)],
                  );
                }}
                key={choice.id}
                className={clsx(
                  'flex flex-col gap-2 items-center justify-between bg-gray-800 px-2 py-4 rounded border-none',
                  selection[idx] === choice.id
                    ? 'outline outline-4 outline-blue-500'
                    : '',
                )}
              >
                <Choice choice={choice} />
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
