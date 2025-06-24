import { Action } from '@long-game/game-gunboats-definition/v1';
import { Token, TokenHand } from '@long-game/game-ui';
import { ActionCard } from './ActionCard';
import { useActiveAction } from './actionState';
import { hooks } from './gameClient';

export interface ActionHandProps {}

export const ActionHand = hooks.withGame<ActionHandProps>(function ActionHand({
  gameSuite,
}) {
  const actions = gameSuite.finalState.draftOptions;
  const takenIds = new Set(
    gameSuite.currentTurn.actions.map((action) => action.id),
  );
  const activeAction = useActiveAction();
  if (activeAction) takenIds.add(activeAction.id);

  const filtered = actions.filter((action) => !takenIds.has(action.id));

  return (
    <TokenHand>
      {filtered.map((action) => (
        <ActionHandItem key={action.id} action={action} />
      ))}
    </TokenHand>
  );
});

export interface ActionHandItemProps {
  action: Action;
}

function ActionHandItem({ action }: { action: Action }) {
  return (
    <Token id={action.id} data={action}>
      <ActionCard action={action} />
    </Token>
  );
}
