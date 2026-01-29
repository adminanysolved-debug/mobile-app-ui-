import { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route?: string;
  iconBg: string;
  iconColor: string;
  danger?: boolean;
};

const connectionItem: MenuItem = {
  icon: "users",
  label: "Connections",
  route: "Connections",
  iconBg: "rgba(45, 39, 82, 0.6)",
  iconColor: "#C4B5FD",
};

const achievementsItem: MenuItem = {
  icon: "award",
  label: "My Achievements",
  route: "WallOfFame",
  iconBg: "rgba(45, 39, 82, 0.6)",
  iconColor: "#FBBF24",
};

const themeItem: MenuItem = {
  icon: "sun",
  label: "Theme & Appearance",
  route: "Themes",
  iconBg: "rgba(45, 39, 82, 0.6)",
  iconColor: "#A78BFA",
};

const ordersItems: MenuItem[] = [
  {
    icon: "shopping-bag",
    label: "My Purchase",
    route: "Market",
    iconBg: "rgba(45, 39, 82, 0.6)",
    iconColor: "#C4B5FD",
  },
  {
    icon: "credit-card",
    label: "My Wallet",
    route: "Wallet",
    iconBg: "rgba(45, 39, 82, 0.6)",
    iconColor: "#C4B5FD",
  },
];

const accountItems: MenuItem[] = [
  {
    icon: "edit-2",
    label: "Edit Profile",
    route: "EditProfile",
    iconBg: "rgba(45, 39, 82, 0.6)",
    iconColor: "#60A5FA",
  },
  {
    icon: "log-out",
    label: "Sign Out",
    route: "SignOut",
    iconBg: "rgba(45, 39, 82, 0.6)",
    iconColor: "#FBBF24",
  },
  {
    icon: "trash-2",
    label: "Delete Account",
    route: "DeleteAccount",
    iconBg: "rgba(45, 39, 82, 0.6)",
    iconColor: "#F87171",
    danger: true,
  },
];

function MenuRow({
  item,
  isLast,
  onPress,
}: {
  item: MenuItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuRow, !isLast ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null]}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
        <Feather name={item.icon} size={20} color={item.iconColor} />
      </View>
      <ThemedText
        type="body"
        style={[
          styles.menuLabel,
          item.danger ? { color: "#DC2626" } : null,
        ]}
      >
        {item.label}
      </ThemedText>
      <Feather name="chevron-right" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme, currentTheme } = useTheme();
  const { user, logout, token, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (route?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route === "SignOut") {
      handleLogout();
    } else if (route === "EditProfile") {
      setEditFullName(user?.fullName || "");
      setEditBio(user?.bio || "");
      setShowEditModal(true);
    } else if (route === "DeleteAccount") {
      setShowDeleteModal(true);
    } else if (route) {
      navigation.navigate(route);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(new URL('/api/profile', getApiUrl()).toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName: editFullName, bio: editBio }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setShowEditModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(new URL('/api/profile', getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.profileCard}>
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Feather name="user" size={40} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.profileInfo}>
              <ThemedText
                type="xs"
                style={[styles.profileLabel, { color: theme.textSecondary }]}
              >
                USERNAME
              </ThemedText>
              <ThemedText type="h3" style={styles.username}>
                @{user?.username || "user"}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Full Name
              </ThemedText>
              <ThemedText type="body" style={styles.fullName}>
                {user?.fullName || "User"}
              </ThemedText>
              {user?.bio ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
                  {user.bio}
                </ThemedText>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        <AdBanner variant="compact" />

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card
            onPress={() => handleNavigate(connectionItem.route)}
            style={styles.linkCard}
          >
            <View style={[styles.linkIcon, { backgroundColor: connectionItem.iconBg }]}>
              <Feather name={connectionItem.icon} size={24} color={connectionItem.iconColor} />
            </View>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                {connectionItem.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                View followers and following
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card
            onPress={() => handleNavigate(achievementsItem.route)}
            style={styles.linkCard}
          >
            <View style={[styles.linkIcon, { backgroundColor: achievementsItem.iconBg }]}>
              <Feather name={achievementsItem.icon} size={24} color={achievementsItem.iconColor} />
            </View>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                {achievementsItem.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                View your badges and awards
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(175).springify()}>
          <Card
            onPress={() => handleNavigate(themeItem.route)}
            style={styles.linkCard}
          >
            <LinearGradient
              colors={currentTheme.colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkIcon}
            >
              <Feather name="sun" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                {themeItem.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Current: {currentTheme.name}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText
            type="xs"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            MY ORDERS
          </ThemedText>
          <Card style={styles.menuCard}>
            {ordersItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={index === ordersItems.length - 1}
                onPress={() => handleNavigate(item.route)}
              />
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <ThemedText
            type="xs"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            MY ACCOUNT
          </ThemedText>
          <Card style={styles.menuCard}>
            {accountItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={index === accountItems.length - 1}
                onPress={() => handleNavigate(item.route)}
              />
            ))}
          </Card>
        </Animated.View>
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.modalTitle}>Edit Profile</ThemedText>
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Bio</ThemedText>
            <TextInput
              style={[styles.textInput, styles.bioInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowEditModal(false)} style={[styles.modalButton, { borderColor: theme.border }]}>
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Button onPress={handleSaveProfile} disabled={isLoading} style={styles.saveButton}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.modalTitle}>Delete Account</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowDeleteModal(false)} style={[styles.modalButton, { borderColor: theme.border }]}>
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleDeleteAccount} style={[styles.deleteButton]}>
                <ThemedText type="body" style={{ color: theme.text }}>
                  {isLoading ? "Deleting..." : "Delete"}
                </ThemedText>
              </Pressable>
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
  profileCard: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  profileInfo: {
    alignItems: "center",
  },
  profileLabel: {
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  username: {
    marginBottom: Spacing.sm,
  },
  fullName: {
    fontWeight: "500",
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  sectionLabel: {
    fontWeight: "500",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    letterSpacing: 0.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
});
