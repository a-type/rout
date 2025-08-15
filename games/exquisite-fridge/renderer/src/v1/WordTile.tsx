import { Box, clsx, Icon } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import { Token } from '@long-game/game-ui';
import { hooks } from './gameClient.js';

export interface WordTileProps {
  value: WordItem;
  className?: string;
  disabled?: boolean;
  movedBehavior?: 'fade' | 'remove';
  disableChat?: boolean;
}

export const WordTile = hooks.withGame<WordTileProps>(function WordTile({
  gameSuite,
  value,
  className,
  disabled,
  movedBehavior = 'fade',
  disableChat,
}) {
  const isBlank = value.text === '';
  const isHandwritten = !!value.isWriteIn;

  return (
    <Token
      id={value.id}
      data={value}
      disabled={disabled || gameSuite.turnWasSubmitted}
      className={clsx(
        'relative rounded-xs color-black border border-gray-dark shadow-gray-dark shadow-[1px_1px_0_1px]',
        value.isNew ? 'bg-primary-wash' : 'bg-white',
        className,
      )}
      handleProps={{
        // words are smaller; move the upward a bit
        touchOffset: -60,
      }}
      movedBehavior={movedBehavior}
      disableChat={disableChat}
      name="Word Tile"
      helpContent={
        isBlank ? (
          <div>You can use these special tiles to write your own words in.</div>
        ) : value.isNew ? (
          <div>This word is new, it was just drawn this round.</div>
        ) : null
      }
      rulesId={isBlank ? 'blank-tiles' : value.isNew ? 'new-tiles' : undefined}
    >
      <Box
        className={clsx(
          'px-lg py-xs h-full',
          isHandwritten && 'font-[cursive] text-sm',
        )}
      >
        {isBlank ? (
          <span className="color-gray-dark">
            <Icon name="pencil" />
            ...
          </span>
        ) : (
          <span>{value.text}</span>
        )}
      </Box>
      {value.isNew && (
        <Icon
          name="star"
          className="absolute -top-1 -right-1 fill-primary rotate-5"
        />
      )}
    </Token>
  );
});
