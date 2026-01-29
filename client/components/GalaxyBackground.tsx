import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

interface GalaxyBackgroundProps {
  children: React.ReactNode;
}

export function GalaxyBackground({ children }: GalaxyBackgroundProps) {
  const { currentTheme, isDark } = useTheme();
  const themeId = currentTheme.id;

  const getBackgroundColors = (): [string, string, string, string] => {
    switch (themeId) {
      case "galaxy":
        return ["#0D0B1E", "#1A1040", "#2D1B4E", "#1A1533"];
      case "dark":
        return ["#0F172A", "#1E293B", "#334155", "#1E293B"];
      case "midnight":
        return ["#020617", "#0F172A", "#1E293B", "#0F172A"];
      case "light":
        return ["#F9FAFB", "#FFFFFF", "#F3F4F6", "#FFFFFF"];
      case "ocean":
        return ["#E0F2FE", "#F0F9FF", "#BAE6FD", "#F0F9FF"];
      case "sunset":
        return ["#FFF7ED", "#FFFBEB", "#FED7AA", "#FFFBEB"];
      case "forest":
        return ["#F0FDF4", "#ECFDF5", "#BBF7D0", "#ECFDF5"];
      case "lavender":
        return ["#F5F3FF", "#FAF5FF", "#DDD6FE", "#FAF5FF"];
      case "rose":
        return ["#FDF2F8", "#FFF1F2", "#FECDD3", "#FFF1F2"];
      default:
        return ["#0D0B1E", "#1A1040", "#2D1B4E", "#1A1533"];
    }
  };

  const showStars = themeId === "galaxy" || themeId === "dark" || themeId === "midnight";
  const backgroundColors = getBackgroundColors();

  return (
    <View style={[styles.container, { backgroundColor: backgroundColors[0] }]}>
      <LinearGradient
        colors={backgroundColors}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {showStars ? (
        <View style={styles.starsOverlay}>
          <View style={[styles.star, { top: "5%", left: "15%" }]} />
          <View style={[styles.star, { top: "8%", left: "75%" }]} />
          <View style={[styles.star, { top: "12%", left: "45%" }]} />
          <View style={[styles.star, { top: "3%", left: "85%" }]} />
          <View style={[styles.star, { top: "15%", left: "25%" }]} />
          <View style={[styles.star, { top: "7%", left: "55%" }]} />
          <View style={[styles.starLarge, { top: "10%", left: "70%" }]} />
          <View style={[styles.starLarge, { top: "6%", left: "30%" }]} />
        </View>
      ) : null}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    opacity: 0.5,
  },
  starLarge: {
    position: "absolute",
    width: 3,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1.5,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
});
