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
    (playerIndex * 2 + roundIndex) % sequenceCount,
    (playerIndex * 2 + roundIndex + 1) % sequenceCount,
  ];
}
