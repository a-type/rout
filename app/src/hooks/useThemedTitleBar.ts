import {
  getResolvedColorMode,
  useColorMode,
  useTitleBarColor,
} from '@a-type/ui';

export function useThemedTitleBar() {
  useTitleBarColor(useDefaultBgColor());
}

export function useDefaultBgColor() {
  useColorMode();
  const colorMode = getResolvedColorMode();
  return colorMode === 'dark' ? '#1b1522' : '#fffbff';
}
