import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
};

const menuItems: MenuItem[] = [
  { icon: "user", label: "PERSONAL PROFILE", route: "Profile" },
  { icon: "briefcase", label: "VENDOR PROFILE", route: "VendorProfile" },
  { icon: "credit-card", label: "SUBSCRIPTION", route: "Subscription" },
  { icon: "bell", label: "NOTIFICATIONS", route: "Notifications" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user, logout, forgotPassword } = useAuth();

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route === "Profile") {
      navigation.navigate("ProfileTab");
    } else if (route === "Subscription") {
      navigation.navigate("Subscription");
    } else if (route === "Notifications") {
      navigation.navigate("Notifications");
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              Alert.alert("Success", "You have been logged out.");
            } catch (err) {
              console.error("Logout error", err);
              Alert.alert("Error", "Logout failed. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Change Password",
      "We will send a password reset link to your email. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Email",
          style: "default",
          onPress: async () => {
            if (user?.email) {
              const res = await forgotPassword(user.email);
              if (res.success) {
                Alert.alert("Success", "Password reset instructions sent to your email.");
              } else {
                Alert.alert("Error", res.error || "Failed to send reset link.");
              }
            }
          }
        }
      ]
    );
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + insets.bottom + SCROLL_BOTTOM_EXTRA,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={true}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.userInfoCard}>
            <View style={styles.userInfoRow}>
              <Feather name="user" size={24} color={theme.textSecondary} />
              <View style={styles.userInfoContent}>
                <ThemedText
                  type="small"
                  style={{ color: theme.textMuted }}
                >
                  User Name
                </ThemedText>
                <ThemedText type="body" style={[styles.userInfoValue, { color: theme.text }]}>
                  {user?.username || "Not set"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.userInfoRow}>
              <Feather name="user" size={24} color={theme.textSecondary} />
              <View style={styles.userInfoContent}>
                <ThemedText
                  type="small"
                  style={{ color: theme.textMuted }}
                >
                  Full Name
                </ThemedText>
                <ThemedText type="body" style={[styles.userInfoValue, { color: theme.text }]}>
                  {user?.fullName || "Not set"}
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <AdBanner variant="compact" />

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => handleNavigate(item.route)}
                style={[
                  styles.menuRow,
                  index < menuItems.length - 1 ? styles.menuRowBorder : null,
                ]}
              >
                <View style={styles.menuIcon}>
                  <Feather name={item.icon} size={20} color={theme.textSecondary} />
                </View>
                <ThemedText type="body" style={[styles.menuLabel, { color: theme.text }]}>
                  {item.label}
                </ThemedText>
                <Feather name="chevron-right" size={20} color="#A78BFA" />
              </Pressable>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card style={styles.menuCard}>
            <Pressable
              onPress={handleChangePassword}
              style={[styles.menuRow, styles.menuRowBorder]}
            >
              <View style={styles.menuIcon}>
                <Feather name="lock" size={20} color={theme.textSecondary} />
              </View>
              <ThemedText type="body" style={[styles.menuLabel, { color: theme.text }]}>
                CHANGE PASSWORD
              </ThemedText>
              <Feather name="chevron-right" size={20} color="#A78BFA" />
            </Pressable>

            <Pressable
              onPress={handleLogout}
              style={styles.menuRow}
            >
              <View style={styles.menuIcon}>
                <Feather name="log-out" size={20} color="#EF4444" />
              </View>
              <ThemedText type="body" style={[styles.menuLabel, { color: "#EF4444" }]}>
                LOG OUT
              </ThemedText>
            </Pressable>
          </Card>
        </Animated.View>
      </ScrollView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  userInfoCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  userInfoContent: {
    flex: 1,
  },
  userInfoValue: {
    fontWeight: "500",
    marginTop: 2,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 127, 199, 0.3)",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  menuLabel: {
    flex: 1,
    fontWeight: "500",
  },
});
