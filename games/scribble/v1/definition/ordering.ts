export function getPlayerSequenceIndexes({
  sequenceCount,
  roundIndex,
  playerIndex,
}: {
  sequenceCount: number;
  roundIndex: number;
  playerIndex: number;
}): number[] {
  return [
    (playerIndex * 2 + roundIndex * 2) % sequenceCount,
    (playerIndex * 2 + roundIndex * 2 + 1) % sequenceCount,
  ];
}
