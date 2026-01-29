import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

type MenuItemType = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  gradient: [string, string];
};

const menuItems: MenuItemType[] = [
  {
    icon: "target",
    label: "My RealDream",
    route: "MyRealDream",
    gradient: ["#7C3AED", "#A855F7"],
  },
  {
    icon: "users",
    label: "Social",
    route: "NewsFeed",
    gradient: ["#EC4899", "#F472B6"],
  },
  {
    icon: "award",
    label: "Champions",
    route: "Champions",
    gradient: ["#EAB308", "#FCD34D"],
  },
  {
    icon: "shopping-bag",
    label: "Market",
    route: "Market",
    gradient: ["#22C55E", "#4ADE80"],
  },
  {
    icon: "image",
    label: "Gallery",
    route: "Gallery",
    gradient: ["#3B82F6", "#60A5FA"],
  },
  {
    icon: "rss",
    label: "News Feed",
    route: "NewsFeed",
    gradient: ["#6366F1", "#818CF8"],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MenuItem({ item, index }: { item: MenuItemType; index: number }) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(item.route);
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={styles.menuItemWrapper}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.menuItem, animatedStyle]}
      >
        <View style={styles.glassCard}>
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name={item.icon} size={28} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText type="small" style={styles.menuLabel}>
            {item.label}
          </ThemedText>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function MainMenuScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Notifications");
  };

  const handleMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Messages");
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <ThemedText type="h2" style={styles.welcomeTitle}>
                Welcome back,
              </ThemedText>
              <ThemedText type="h3" style={styles.userName}>
                {user?.fullName || user?.username || "Dreamer"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.coinBalanceCard}>
            <LinearGradient
              colors={["#7C3AED", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.coinGradient}
            >
              <View style={styles.coinContent}>
                <View style={styles.coinIconContainer}>
                  <Feather name="star" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <ThemedText type="small" style={styles.coinLabel}>
                    Your Balance
                  </ThemedText>
                  <ThemedText type="h2" style={styles.coinAmount}>
                    {user?.coins?.toLocaleString() || "0"} Points
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => navigation.navigate("Wallet")}
                style={styles.addCoinsButton}
              >
                <Feather name="plus" size={20} color="#7C3AED" />
              </Pressable>
            </LinearGradient>
          </View>
        </Animated.View>

        <AdBanner />

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <MenuItem key={item.label} item={item} index={index} />
          ))}
        </View>
      </ScrollView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    color: "#8B7FC7",
    fontWeight: "500",
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  coinBalanceCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  coinGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  coinContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  coinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  coinLabel: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  coinAmount: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  addCoinsButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  menuItemWrapper: {
    width: "48%",
  },
  menuItem: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  glassCard: {
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.2)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
