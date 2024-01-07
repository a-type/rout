# long-game

An app for playing games with friends over a couple weeks.

## Structure

- `apps/`: The main things. The ones that get run as processes somewhere.

  - `apps/server`: The part that runs on a box somewhere.
  - `apps/web`: The part that runs in the browser.

- `games/`: Implementations of different games! They mainly use the library from `packages/game-client` for core functionality. They render React components for all UI and implement logic according to a set interface.

- `packages/`: Various internal libraries.
  - `packages/auth`: OAuth2 integration for login stuff. Probably moving to an external lib soon.
  - `packages/common`: Some basic shared types and utils.
  - `packages/db`: Defines database schema, migrations, typings, and a few small utilities for ids and such.
  - `packages/game-cache`: A cache to compute and store game states from a list of moves and initial states. Used to reduce database loads as these things don't change from day to day.
  - `packages/game-client`: A client which gives access to the server APIs. It also stores local game state and provides tools to manipulate it and react to changes.
  - `packages/game-definition`: A central interface that describes what a game needs to run on the platform. Implement this to make a game! Games each have a unique ID as defined by this interface.
  - `packages/games`: A barrel package that holds all the known games for lookup by their ID.
  - `packages/trpc`: A TRPC API router that defines all the RPCs between the server and client.

## Making a new game

I have a generator for this! Run `pnpm gen` to get started. It will scaffold the code.

## Making a new package

Same deal, run `pnpm gen`.
