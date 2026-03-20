import { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
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
import { getApiUrl } from "@/lib/query-client";
import { Button } from "@/components/Button";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
};

const menuItems: MenuItem[] = [
  { icon: "layout", label: "THEMES", route: "Themes" },
  { icon: "credit-card", label: "SUBSCRIPTION", route: "Subscription" },
  { icon: "bell", label: "NOTIFICATIONS", route: "Notifications" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user, logout, forgotPassword, token, updateUser } = useAuth();

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorBusinessName, setVendorBusinessName] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVendorHubPress = () => {
    if (user?.isVendor) {
      navigation.navigate("VendorHub");
    } else {
      setShowVendorModal(true);
    }
  };

  const handleApplyVendor = async () => {
    if (!token) return;
    if (!vendorBusinessName.trim()) {
      alert("Business Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(new URL('/api/vendor/apply', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: vendorBusinessName,
          description: vendorDescription
        })
      });

      if (response.ok) {
        updateUser({ isVendor: true });
        setShowVendorModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "You are now a vendor!");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to apply as vendor");
      }
    } catch (error) {
      console.error("Apply vendor error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route === "Profile") {
      navigation.navigate("ProfileMain");
    } else if (route === "Subscription") {
      navigation.navigate("Subscription");
    } else if (route === "Themes") {
      navigation.navigate("Themes");
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
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + SCROLL_BOTTOM_EXTRA,
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
      <Modal visible={showVendorModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.modalTitle}>Become a Vendor</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
              Start selling premium dream themes and content on the marketplace.
            </ThemedText>

            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Business/Creator Name *</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={vendorBusinessName}
              onChangeText={setVendorBusinessName}
              placeholder="Enter your creator name"
              placeholderTextColor={theme.textMuted}
            />

            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Description</ThemedText>
            <TextInput
              style={[styles.textInput, styles.bioInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={vendorDescription}
              onChangeText={setVendorDescription}
              placeholder="What will you sell?"
              placeholderTextColor={theme.textMuted}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowVendorModal(false)} style={[styles.modalButton, { borderColor: theme.border }]}>
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Button onPress={handleApplyVendor} disabled={isLoading} style={styles.saveButton}>
                {isLoading ? "Applying..." : "Apply Now"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
  },
  inputLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 48,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  userInfoCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  },
  menuLabel: {
    flex: 1,
    fontWeight: "500",
  },
});
