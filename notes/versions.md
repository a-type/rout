# Versioning games

Ok, so a game is launched. Since games last a long time, we can more or less assume (if the app is actually being used, lol) that there's always at least one session of this game ongoing.

What happens when we want (or need) to make a change to the game?

We use the concept of 'versioning' to decide how to roll out changes. This roughly aligns with semver.

## Minor versions

When a game mechanic or bit of logic is modified in a non-breaking way (say, a bug or exploitable condition is fixed), this is a minor version. Minor versions can be deployed to in-progress game sessions. When players load up the game, their moves will be replayed against the initial state as usual, including any changes made to the logic of how those moves are applied.

For minor versions, these changes shouldn't meaningfully affect the state of most games.

## Major versions

When game mechanics are extended or otherwise make non-breaking changes, we need a major version. Major versions cannot be applied to in-progress games.

To deploy major versions, we must make a copy of the game definition and any parts of the game client which rely on changes made to the definition, and deploy both copies of the code. Games which are in progress on the old version continue play against the old codebase.

When these older games complete, the old version's code can be removed.

## What determines a major version?

- Changes to use of randomness. Since random values are deterministically produced in sequence, any change to calls to `random` will result in a breaking change.
- Changes to required move information which can't be defaulted or inferred.
- Any general change to logic which would change the meaning of a move when replayed.
- Changes to turn properties. Even a rename.
- Changes to game state properties, even a rename.
