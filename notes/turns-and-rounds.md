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

## Round advancement logic

Different games may have different ways of advancing rounds, different requirements for number of turns and whether players must play turns, and different needs for who is notified that they must play, and when.

We attempt to provide the right abstractions to make these differences representable without making you jump through too many hoops.

### Some examples

To explore the problem space, let's imagine some different game needs w.r.t. rounds.

1. A game which requires 1 turn from every player, at which point it advances the round immediately.
2. A game which advances when all players play a turn, _or_ at midnight, whichever comes first.
3. A game which has each player submit one turn in sequence, one after the other, and advances the round after the last player has played.
4. A game which simply advances each day, whether or not anyone plays.
5. A game in which only one player may play each round, submitting multiple turns, until some state condition is met which advances to the next round and next player.

Some patterns emerge:

- We want to know the moment a player is now allowed to make a move. This might be triggered by a game change, or by a scheduled time, like a change of calendar day. This is when we send a notification to that player that it's time to play.
- Otherwise, we just need to know the current round index, to know how to compute the game state. This index should be computable from the players, game state, and wall clock time.

When we apply a change to the game, such as a turn, we check round status. This computation returns the following data to make decisions on next actions:

- The computed round index
- Which players have pending turns this round
- What time, if any, the system should check this again

Returning to our earlier examples, some example return values:

1. Simply returns current round and who has yet to play.
2. Marks unplayed players as pending, but also asks for a recheck at midnight. Regardless of turns, that recheck will produce the next round index (and a reset pending players list).
3. Only marks one player as pending at a time, but otherwise is straightforward. Since a recheck happens naturally after the hotseat player plays, there is no need for scheduling.
4. Would return all players as pending, since anyone can play whenever, and ask for a recheck at midnight (when the round will advance).
5. Will continually return the same player on each change to the game, until the player's hotseat is done, at which point it will return the next sequenced player.

### Notification state

Notifications are a little tricky, since they are an imperative side effect. We want to notify promptly, and avoid notifying multiple times.

We can use the game session's durable state to accomplish this. For each player, we store a round notification state.

```ts
{
  playersNotified: Record<PrefixedId<'u'>, '<utc date string>' | null>,
  roundIndex: number,
}
```

Whenever the round data is calculated, we compare the round index to this notification state. If the indexes differ, we reset the map to `null`s for all players.

From here on, whenever a player shows up in the round's `pendingTurn` list, we see if they have an existing entry in `playersNotified`. If not, notify them immediately and create an entry with the current time. This is immediately done with the data returned from the round calculation to notify initial player(s) that it's time to play.
