# Turns and rounds

Each player _may_ play one turn per round. A turn can be anything, depending on the game (turns may contain multiple moves).

Rounds are advanced based on logic specified in the game's definition.

## Round index

Turns out (no pun intended) that keeping a mental model of _which_ round it is gets a little head-spinning, especially with regards of what information is public and what isn't.

Here's a cheat sheet...

When you begin a game, the round index is `0`. The player state is computed by applying all _prior_ turns (there are none) to the initial state, resulting in the initial state.

When you play one round, the round index is now `1`. The player state is computed by applying all _prior_ turns, so only turns from round `0`.

When you play a a turn on round `1`, the round index remains `1` (until everyone plays). Player state doesn't change.

However, if the current round advances to `2`, when you go back to view round `1`, you should be able to see what happened there.

When rendering a game, we care about several states:

- What is the starting player state for the current, active, incomplete round?
- What changed since the prior round ended?
  - This requires knowing the starting state of the prior round, and
  - This requires knowing the public turn information for the prior round

When viewing game history, we step backward, and those values become:

- The end state of the viewed historical round
- The start state of the viewed historical round
- The public turn info for the viewed historical round

With all that in mind, the client organizes current and historical data to make these states easily accessible.

When viewing the current round (default), the client preloads the prior round's initial player state in addition to the present (active) round's initial state. It also preloads the public turns from the prior round. This gives enough information to immediately inform the player of what happened last round to get them to the current state.
