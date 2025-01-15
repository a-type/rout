import { hooks } from '../hooks';

export interface TurnErrorProps {}

export function TurnError({}: TurnErrorProps) {
  const {
    data: { error },
  } = hooks.useGetCurrentTurn();

  if (error) {
    return <span>{error}</span>;
  }

  return null;
}
