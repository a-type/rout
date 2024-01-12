# Nomad

In Nomad, you play the role of a caravan traveling the land in search of mystical artifacts and blessings. You have received premonitions of the future, and you also know of a prophecy that will unfold at some point in the game.

## Objective

Your goal is to end the game with the most blessings.

## Turn

On your turn, you may move your caravan to an adjacent location, or you may stay in your current location.

## Blessing track

* Each turn, a new blessing is revealed on the blessing track. Anyone who is present in the location of the blessing may take it by spending a turn there. If at any time, three or more blessings are revealed, the oldest one vanishes.

## Prophecy
At the start of the game, you are given a prophecy, which will tell of a sequence of blessings that will happen during the game.

# Technical specs

## Game state

The game state is stored as a 2d array of terrain tiles, each of which has a terrain type and may have a special feature.

The list of blessings is stored as a queue.

Player moves are stored as a position in the grid.