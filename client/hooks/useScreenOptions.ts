import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import { useTheme } from "@/hooks/useTheme";

interface ScreenOptionsConfig {
  transparent?: boolean;
}

export function useScreenOptions(
  config: ScreenOptionsConfig = { transparent: true }
): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();

  const baseOptions: NativeStackNavigationOptions = {
    headerTintColor: theme.text,
    headerBackTitleVisible: false,
    headerTitleStyle: {
      fontWeight: "600" as const,
      color: theme.text,
    },
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
    animation: "slide_from_right",
  };

  if (config.transparent) {
    return {
      ...baseOptions,
      headerTransparent: true,
      headerBlurEffect: isDark ? "dark" : "light",
      headerStyle: {
        backgroundColor: Platform.select({
          ios: "transparent",
          android: theme.backgroundDefault,
          web: theme.backgroundDefault,
        }),
      },
    };
  }

  return {
    ...baseOptions,
    headerTransparent: false,
    headerStyle: {
      backgroundColor: theme.backgroundDefault,
    },
  };
}
