import { Button, clsx, Dialog } from '@a-type/ui';
import { Choice as ChoiceType } from '@long-game/game-wizard-ball-definition';
import { useEffect, useState } from 'react';
import { hooks } from './gameClient.js';
import { ItemDefChip } from './items/ItemChip.js';
import { PerkChip } from './perks/PerkChip.js';
import { StatusChip } from './perks/StatusChip.js';
import { PlayerChip } from './players/PlayerChip.js';
import { shortAttribute, useSendTurn } from './utils.js';

export function Choice({ choice, id }: { choice: ChoiceType; id?: string }) {
  if (choice.kind === 'item') {
    return (
      <>
        <span className="text-sm font-semibold">Gain </span>
        <ItemDefChip id={choice.itemDefId} />
      </>
    );
  }
  if (choice.kind === 'buff') {
    return (
      <>
        <span className="text-sm font-semibold">Team gains </span>
        <span className="font-normal">
          <StatusChip id={choice.statusId} stacks={choice.stacks} />
        </span>
      </>
    );
  }
  if (choice.kind === 'xp') {
    if (id && choice.playerId === id) {
      return (
        <>
          <span className="text-sm font-semibold">Gain </span>
          <span className="text-sm font-normal">{choice.amount}XP</span>
        </>
      );
    }
    return (
      <>
        <span className="text-sm font-semibold">
          <PlayerChip id={choice.playerId} />
        </span>
        <span className="text-sm font-normal">gains {choice.amount}XP</span>
      </>
    );
  }
  if (choice.kind === 'newPlayer') {
    return (
      <>
        <span className="text-sm font-semibold">Gain </span>
        <span className="text-sm font-normal">
          <PlayerChip id={choice.playerId} />
        </span>
      </>
    );
  }
  if (choice.kind === 'extraPosition') {
    if (id && choice.playerId === id) {
      return (
        <>
          <span className="text-sm font-semibold">Gain </span>
          <span className="text-sm font-normal">
            {choice.position.toUpperCase()} position
          </span>
        </>
      );
    }
    return (
      <>
        <span className="text-sm font-semibold">
          <PlayerChip id={choice.playerId} />
        </span>
        <span className="text-sm font-normal">
          gains {choice.position.toUpperCase()} position
        </span>
      </>
    );
  }
  if (choice.kind === 'perk') {
    if (id && choice.playerId === id) {
      return (
        <>
          <span className="text-sm font-semibold">Gain </span>
          <PerkChip id={choice.perkId} />
        </>
      );
    }

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
    if (id && choice.playerId === id) {
      return (
        <>
          <span className="text-sm font-semibold">Gain </span>
          <span
            className={clsx(
              'text-sm uppercase',
              amount > 0 ? 'color-accent-dark' : 'color-attention-dark',
            )}
          >
            {amount > 0 ? '+' : ''}
            {amount} {shortAttribute(attribute)}
          </span>
        </>
      );
    }
    return (
      <>
        <span className="text-sm font-semibold">
          <PlayerChip id={choice.playerId} />{' '}
        </span>
        <span className="font-normal">gains</span>
        <span
          className={clsx(
            'text-sm uppercase',
            amount > 0 ? 'color-accent-dark' : 'color-attention-dark',
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
            amount > 0 ? 'color-accent-dark' : 'color-attention-dark',
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
    return <div className="color-gray-dark">No choices available.</div>;
  }
  const selectedOption = options.find((choice) => choice.id === selection);

  return (
    <div className="mb-4">
      <Dialog>
        <Dialog.Trigger
          render={
            <Button className="bg-white hover:bg-gray-wash px-4 py-2 rounded" />
          }
        >
          {selectedOption ? (
            <Choice choice={selectedOption} />
          ) : (
            <span>Choose a boon!</span>
          )}
        </Dialog.Trigger>
        <Dialog.Content className="bg-white p-4 rounded shadow-lg max-w-xl">
          <Dialog.Title className="mb-0">Choose a boon</Dialog.Title>
          <Dialog.Description className="mt-0">
            <span className="text-sm color-gray-dark">
              Select one of the following options to improve your team.
            </span>
            <div className="flex flex-col gap-4 flex-wrap items-start mt-4">
              {options.map((choice) => {
                return (
                  <Dialog.Close
                    key={choice.id}
                    render={
                      <Button
                        onClick={() => {
                          setSelection(choice.id);
                        }}
                        className={clsx(
                          'flex flex-row gap-2 items-center justify-between bg-gray-wash px-2 py-4 rounded border-none',
                          selection === choice.id
                            ? 'outline outline-4 outline-primary'
                            : '',
                        )}
                      />
                    }
                  >
                    <Choice choice={choice} />
                  </Dialog.Close>
                );
              })}
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog>
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
    return <div className="color-gray-dark">No choices available.</div>;
  }
  return (
    <div className="my-4 flex flex-col gap-4 items-start">
      {optionsGroups.map((options, idx) => (
        <Dialog key={idx}>
          <Dialog.Trigger
            render={
              <Button className="bg-white hover:bg-gray-wash px-4 py-2 rounded" />
            }
          >
            {selection[idx] ? (
              <Choice
                choice={options.find((c) => c.id === selection[idx])!}
                id={id}
              />
            ) : (
              <span>Choose a boon!</span>
            )}
          </Dialog.Trigger>
          <Dialog.Content className="bg-white p-4 rounded shadow-lg max-w-xl">
            <Dialog.Title className="mb-0">Choose a boon</Dialog.Title>
            <Dialog.Description className="mt-0">
              <span className="text-sm color-gray-dark">
                Select one of the following options to improve your player.
              </span>
              <div className="flex flex-col gap-4 flex-wrap items-start mt-4">
                {options.map((choice) => {
                  return (
                    <Dialog.Close
                      key={choice.id}
                      render={
                        <Button
                          onClick={() => {
                            setSelection((v) =>
                              // update choice with index
                              v[idx] === choice.id
                                ? v.filter((c) => c !== choice.id)
                                : [
                                    ...v.slice(0, idx),
                                    choice.id,
                                    ...v.slice(idx + 1),
                                  ],
                            );
                          }}
                          className={clsx(
                            'flex flex-row gap-2 items-center justify-between bg-gray-wash px-2 py-4 rounded border-none',
                            selection[idx] === choice.id
                              ? 'outline outline-4 outline-primary'
                              : '',
                          )}
                        />
                      }
                    >
                      <Choice choice={choice} id={id} />
                    </Dialog.Close>
                  );
                })}
              </div>
            </Dialog.Description>
          </Dialog.Content>
        </Dialog>
      ))}
    </div>
  );
}
