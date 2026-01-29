import { View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedViewProps) {
  const { theme, isDark } = useTheme();

  const getBackgroundColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }
    if (!isDark && lightColor) {
      return lightColor;
    }
    return theme.backgroundRoot;
  };

  return (
    <View
      style={[
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      {...rest}
    />
  );
}
