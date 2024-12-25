import { useGameSession } from './useGameSession.js';

export function usePlayers() {
  const session = useGameSession();
  return session.members.map((member) => member.user);
}

export function usePlayer(playerId: string) {
  const players = usePlayers();
  return (
    players.find((player) => player.id === playerId) ?? {
      id: playerId,
      name: 'Anonymous',
      color: 'gray',
    }
  );
}

export function usePlayerId() {
  const session = useGameSession();
  return session.state.playerId;
}
