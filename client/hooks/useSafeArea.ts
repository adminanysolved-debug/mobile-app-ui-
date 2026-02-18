import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SCROLL_BOTTOM_EXTRA } from '@/constants/theme';

export function useSafeScrollPadding() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const topPadding = Platform.select({
    ios: insets.top + 20,
    android: insets.top + 24,
    default: 20,
  });

  const bottomPadding = tabBarHeight + insets.bottom + SCROLL_BOTTOM_EXTRA;

  return {
    paddingTop: topPadding,
    paddingBottom: bottomPadding,
  };
}