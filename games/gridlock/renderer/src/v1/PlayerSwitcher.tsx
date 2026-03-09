import { Button, Tabs, clsx, withClassName } from '@a-type/ui';
import { PlayerAvatar, SubmitTurn } from '@long-game/game-ui';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { BoardRenderer } from './board/BoardRenderer.js';
import { hooks } from './gameClient.js';
import { TileHand } from './hand/TileHand.js';
import { rendererState } from './state.js';

export interface PlayerSwitcherProps {
  className?: string;
}

const StyledBoardRenderer = withClassName(
  BoardRenderer,
  'max-w-100vmin max-h-100vmin min-w-300px min-h-300px basis-0 grow',
);

const StyledTabsContent = withClassName(
  Tabs.Content,
  'flex flex-col items-center justify-center grow',
);

const StyledTabsTrigger = withClassName(
  Tabs.Unstyled.Tab,
  'data-[active]:bg-main-light',
);

const StyledTabsList = withClassName(
  Tabs.Unstyled.List,
  'flex items-center gap-xs p-xs',
);

export const PlayerSwitcher = hooks.withGame<PlayerSwitcherProps>(
  function PlayerSwitcher({ gameSuite, className }) {
    const value =
      useSnapshot(rendererState).viewingPlayerId ?? gameSuite.playerId;
    // hotseat sync
    useEffect(() => {
      rendererState.viewingPlayerId = gameSuite.playerId;
    }, [gameSuite.playerId]);

    return (
      <Tabs
        value={value}
        onValueChange={(v) => (rendererState.viewingPlayerId = v)}
        className={clsx('flex flex-col gap-sm', className)}
      >
        <StyledTabsList>
          <Button
            size="small"
            render={<StyledTabsTrigger value={gameSuite.playerId} />}
          >
            Your Board
          </Button>
          <div className="ml-auto">
            {gameSuite.otherPlayers.map((player) => (
              <Button
                size="small"
                className="p-xxs"
                render={<StyledTabsTrigger key={player.id} value={player.id} />}
              >
                <Button.Icon>
                  <PlayerAvatar playerId={player.id} />
                </Button.Icon>
              </Button>
            ))}
          </div>
        </StyledTabsList>
        <StyledTabsContent
          value={gameSuite.playerId}
          className="flex flex-col gap-lg"
        >
          <StyledBoardRenderer
            board={gameSuite.finalState.board}
            playerId={gameSuite.playerId}
          />
          <div className="w-full flex flex-col gap-xs items-center shrink-0">
            <TileHand />
            <SubmitTurn />
          </div>
        </StyledTabsContent>
        {gameSuite.finalState.otherPlayers.map(({ board, playerId }) => (
          <StyledTabsContent key={playerId} value={playerId}>
            <StyledBoardRenderer board={board} playerId={playerId} readonly />
          </StyledTabsContent>
        ))}
      </Tabs>
    );
  },
);
