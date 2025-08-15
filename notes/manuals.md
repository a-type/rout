# Game Manuals

You can and should create a Markdown rules manual for your game. The template has one ready for you. This powers the "game manual" feature.

## Making linkable titles and words

It's a good idea to link directly to sections of your manual when explaining game concepts in-game. You can create linkable blocks in your manual depending on what you're linking:

- Titles: Add a `{#linkable-id}` to the end: `## Getting Started {#getting-started}`
- Bits of text: Wrap with `[]{#linkable-id}`: `Sometimes you can draw [wild cards]{#wild-cards}`

### Linking to them

Use a `Link` or `navigate` to go to `?rules=true#your-linkable-id` and the rulebook will open to the linked section. These are both available in `useNavigation` from `@long-game/game-ui`.

## Adding rule tooltips to game objects

The rulebook isn't always the best way to remind players of what things are. Most of the time a small, concise tooltip is better.

### Ruletips on tokens

Anything that's a `Token` has built-in ruletip support. Pass `helpContent` for the tooltip content, and `rulesId` for an optional rules section link. It will automatically register a ruletip target.

### Other things

You can wrap anything else in `<HelpSurface>` to turn it into a ruletip-compatible area.

### How players trigger ruletips

Right now this is done with a drag-and-drop interaction, dropping a 'help pin' on the elements you register. This is for maximum getting-out-of-your-way when it comes to how you do interactions in your game. But I'm not sure it's the final vision for the feature, depends on testing.
