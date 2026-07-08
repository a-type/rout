import { Box, clsx, Icon } from '@a-type/ui';
import { Token } from '@long-game/game-ui';
import { WordItem } from '../definition/index';
import { hooks } from './gameClient.js';
import cls from './WordTile.module.css';

export interface WordTileProps {
  value: WordItem;
  className?: string;
  disabled?: boolean;
  used?: boolean;
  movedBehavior?: 'fade' | 'remove';
  disableChat?: boolean;
}

export const WordTile = hooks.withGame<WordTileProps>(function WordTile({
  gameSuite,
  value,
  className,
  disabled,
  used,
  movedBehavior = 'fade',
  disableChat,
}) {
  const isBlank = value.text === '';
  const isHandwritten = !!value.isWriteIn;

  return (
    <Token
      id={used ? `used-${value.id}` : value.id}
      data={value}
      disabled={disabled || used || gameSuite.turnWasSubmitted}
      className={clsx(cls.root, className)}
      data-used={used}
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
      <Box className={clsx(cls.inner, isHandwritten && cls.handwritten)}>
        {isBlank ? (
          <span className={cls.blank}>
            <Icon name="pencil" />
            ...
          </span>
        ) : (
          <span>{value.text}</span>
        )}
      </Box>
      {value.isNew && <Icon name="star" className={cls.new} />}
    </Token>
  );
});
