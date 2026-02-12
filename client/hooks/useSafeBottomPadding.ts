import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing } from "@/constants/theme";

/**
 * Hook to get proper bottom padding that accounts for tab bar on all platforms
 * Use this in ScrollView contentContainerStyle paddingBottom
 */
export function useSafeBottomPadding() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return Platform.select({
    ios: tabBarHeight + Spacing.xl,
    android: tabBarHeight + insets.bottom + Spacing.xl + 20,
    web: tabBarHeight + Spacing.xl,
    default: tabBarHeight + Spacing.xl,
  });
}
