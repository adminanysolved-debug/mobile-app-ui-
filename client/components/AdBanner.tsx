import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface AdBannerProps {
  variant?: "default" | "compact";
}

export function AdBanner({ variant = "default" }: AdBannerProps) {
  const isCompact = variant === "compact";
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Subscription");
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()} 
      style={[styles.container, isCompact && styles.containerCompact]}
    >
      <LinearGradient
        colors={["rgba(124, 58, 237, 0.15)", "rgba(168, 85, 247, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.adLabel}>
            <ThemedText type="xs" style={styles.adLabelText}>AD</ThemedText>
          </View>
          <View style={styles.textContainer}>
            <ThemedText type={isCompact ? "small" : "body"} style={styles.title}>
              {isCompact ? "Upgrade to Premium" : "Unlock Premium Features"}
            </ThemedText>
            {!isCompact && (
              <ThemedText type="xs" style={styles.description}>
                Get unlimited dreams, exclusive badges & more
              </ThemedText>
            )}
          </View>
          <Pressable style={styles.ctaButton} onPress={handlePress}>
            <Feather name="arrow-right" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  containerCompact: {
    marginVertical: Spacing.sm,
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  adLabel: {
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  adLabelText: {
    color: "#A78BFA",
    fontWeight: "700",
    fontSize: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  description: {
    color: "#C4B5FD",
    marginTop: 2,
  },
  ctaButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
