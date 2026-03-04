// Do not delete this file! The main app uses this to render chat messages.
// You can customize this component to change how chat messages are displayed in the game.

import { Button, Icon } from '@a-type/ui';
import { GameChatMessageRenderer } from '@long-game/game-definition';
import {
  isRichChatMessage,
  PathEvent,
} from '@long-game/game-gridlock-definition/v1';
import { DefaultChatMessage, gameLogState } from '@long-game/game-ui';
import { rendererState } from './state';

export const ChatMessage: GameChatMessageRenderer = (props) => {
  if (isRichChatMessage(props.message)) {
    return <RichChatMessage {...props} />;
  }

  return <DefaultChatMessage {...props} />;
};
export default ChatMessage;

const RichChatMessage: GameChatMessageRenderer = (props) => {
  const event = props.message.metadata.event as PathEvent;

  return (
    <DefaultChatMessage.Root {...props}>
      <DefaultChatMessage.Author {...props} />
      <DefaultChatMessage.Bubble {...props}>
        <DefaultChatMessage.Content {...props} />
        <Button
          onClick={() => {
            rendererState.viewingPlayerId = event.playerId;
            rendererState.focusPathId = event.pathId;
            setTimeout(() => {
              rendererState.focusPathId = null;
            }, 3000);
            gameLogState.open = false; // Close the chat log to show the board
          }}
          emphasis="ghost"
          size="small"
        >
          View Path
          <Icon name="arrowRight" />
        </Button>
      </DefaultChatMessage.Bubble>
      <DefaultChatMessage.Metadata {...props} />
    </DefaultChatMessage.Root>
  );
};
