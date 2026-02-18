import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { SCROLL_BOTTOM_EXTRA } from '@/constants/theme';

export function useSafeScrollPadding() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();

  const topPadding = headerHeight + (Platform.select({ ios: 16, android: 20, default: 16 }) ?? 16);

  const bottomPadding = tabBarHeight + insets.bottom + SCROLL_BOTTOM_EXTRA;

  return {
    paddingTop: topPadding,
    paddingBottom: bottomPadding,
  };
}