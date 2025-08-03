import { useDefaultBgColor } from '@/hooks/useThemedTitleBar';
import { useResolvedColorMode, useTitleBarColor } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { TopographyProvider, usePlayerThemed } from '@long-game/game-ui';
import { ReactNode, useLayoutEffect } from 'react';

export function usePlayerThemedPage(playerId: PrefixedId<'u'>) {
  const { className, style, palette } = usePlayerThemed(playerId);
  const backupColor = useDefaultBgColor();
  const resolvedColorMode = useResolvedColorMode();

  const titleColor = !palette
    ? backupColor
    : resolvedColorMode === 'dark'
      ? palette.range[11]
      : palette.range[0];
  useTitleBarColor(titleColor);

  useLayoutEffect(() => {
    document.body.classList.add(className);
    for (const [key, value] of Object.entries(style)) {
      document.body.style.setProperty(key, value as string);
    }

    return () => {
      document.body.classList.remove(className);
      for (const key of Object.keys(style)) {
        document.body.style.removeProperty(key);
      }
    };
  }, [className, style]);

  return { className, style, palette };
}

export const PlayerThemeWrapper = withGame<{ children: ReactNode }>(
  function PlayerThemeWrapper({ gameSuite, children }) {
    const { palette } = usePlayerThemedPage(gameSuite.playerId);

    return (
      <TopographyProvider value={{ palette: palette ?? null }}>
        {children}
      </TopographyProvider>
    );
  },
);
