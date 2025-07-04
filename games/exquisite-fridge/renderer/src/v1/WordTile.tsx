import { Box, clsx, Icon } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import { Token } from '@long-game/game-ui';
import { hooks } from './gameClient';

export interface WordTileProps {
  value: WordItem;
  className?: string;
  disabled?: boolean;
}

export const WordTile = hooks.withGame<WordTileProps>(function WordTile({
  gameSuite,
  value,
  className,
  disabled,
}) {
  const isBlank = value.text === '';
  const isHandwritten = !!value.isWriteIn;

  return (
    <Token
      id={value.id}
      data={value}
      disabled={disabled || gameSuite.turnWasSubmitted}
      className={clsx(
        'relative color-black border border-black shadow-[1px_1px_0_1px_var(--color-black)]',
        value.isNew ? 'bg-primary-wash' : 'bg-white',
        className,
      )}
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
