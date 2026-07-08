import { Box, Button, Tabs, clsx, withClassName } from '@a-type/ui';
import { PlayerAvatar } from '@long-game/game-ui';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { BoardRenderer } from './board/BoardRenderer.js';
import { hooks } from './gameClient.js';
import { TileHand } from './hand/TileHand.js';
import cls from './PlayerSwitcher.module.css';
import { rendererState } from './state.js';

export interface PlayerSwitcherProps {
  className?: string;
}

const StyledBoardRenderer = withClassName(BoardRenderer, cls.boardRenderer);

const StyledTabsContent = withClassName(Tabs.Content, cls.tabsContent);

const StyledTabsTrigger = withClassName(Tabs.Unstyled.Tab, cls.tabsTrigger);

const StyledTabsList = withClassName(Tabs.Unstyled.List, cls.tabsList);

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
        className={clsx(cls.tabs, className)}
      >
        <StyledTabsList>
          <Button
            size="small"
            render={<StyledTabsTrigger value={gameSuite.playerId} />}
          >
            Your Board
          </Button>
          <Box gap="xs" style={{ marginLeft: 'auto' }}>
            {gameSuite.otherPlayers.map((player) => (
              <Button
                key={player.id}
                size="small"
                className="p-xxs"
                render={<StyledTabsTrigger key={player.id} value={player.id} />}
              >
                <Button.Icon>
                  <PlayerAvatar playerId={player.id} />
                </Button.Icon>
              </Button>
            ))}
          </Box>
        </StyledTabsList>
        <StyledTabsContent value={gameSuite.playerId}>
          <StyledBoardRenderer
            board={gameSuite.finalState.board}
            playerId={gameSuite.playerId}
          />
          <div className={cls.hand}>
            <TileHand />
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
