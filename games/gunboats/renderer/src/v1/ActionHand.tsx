import { Action } from '@long-game/game-gunboats-definition/v1';
import { Token, TokenHand } from '@long-game/game-ui';
import { ActionCard } from './ActionCard';
import { hooks } from './gameClient';

export interface ActionHandProps {}

export const ActionHand = hooks.withGame<ActionHandProps>(function ActionHand({
  gameSuite,
}) {
  return (
    <TokenHand>
      {gameSuite.finalState.draftOptions.map((action) => (
        <ActionHandItem key={action.id} action={action} />
      ))}
    </TokenHand>
  );
});

export interface ActionHandItemProps {
  action: Action;
}

export const ActionHandItem = hooks.withGame<ActionHandItemProps>(
  function ActionHandItem({ gameSuite, action }) {
    return (
      <Token id={action.id} data={action}>
        <ActionCard action={action} />
      </Token>
    );
  },
);
