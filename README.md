# _rout!_

An app for playing games with friends over a couple weeks.

## Get started

You will need some secret vars, ask @a-type.

```
pnpm i
pnpm initialize
```

This will walk you through some steps to setup the database and secret values.

### Run the app and sign up

Run `pnpm dev` to start the app. If your environment is all set, it should launch several services. Visit [localhost:3100](http://localhost:3100) to view the app.

Go ahead and sign up for an account. You can use either social or email.

### Become a product admin

Now, we want to make your user a _product admin_, which grants access to the Admin pages and tools.

Run `pnpm become-admin <your-email>`. Now log out and in again to get your updated session token.

### Bootstrap game products

You can buy games in Rout via products. When developing we usually want to have access to all games. To do this, we first need products created by which we can buy them.

There is a job which runs as part of the main dev script which can bootstrap these products for you. If `pnpm dev` is running, visit [http://localhost:3113](http://localhost:3113) and it should say `ok`. Products should be available in the store page now. If you don't see them, you might not be a product admin (see above).

## Structure

- `app`: The app UI.

- `services/api`: The public API.
- `apps/db`: A private service which manages database changes via 'Store' abstractions. The only service with direct DB access.

- `games/`: Implementations of different games! They mainly use the library from `packages/game-client` for core functionality. They render React components for all UI and implement logic according to a set interface.

- `packages/`: Various internal libraries.

  - `packages/auth`: OAuth2 integration for login stuff. Probably moving to an external lib soon.
  - `packages/common`: Some basic shared types and utils.
  - `packages/db`: Defines database schema, migrations, typings, and a few small utilities for ids and such.
  - `packages/game-cache`: A cache to compute and store game states from a list of moves and initial states. Used to reduce database loads as these things don't change from day to day.
  - `packages/game-client`: A client which gives access to the server APIs. It also stores local game state and provides tools to manipulate it and react to changes.
  - `packages/game-definition`: A central interface that describes what a game needs to run on the platform. Implement this to make a game! Games each have a unique ID as defined by this interface.
  - `packages/games`: A barrel package that holds all the known games for lookup by their ID.
  - There are more but they should be relatively self-explanatory when reading the source.

- `jobs/`: Internal/local-use jobs for various tasks which require database usage. Right now these are not deployed, you can run them locally to do specific tasks.

## Making a new game

I have a generator for this! Run `pnpm gen` to get started. It will scaffold the code.

## Making a new package

Same deal, run `pnpm gen`.
