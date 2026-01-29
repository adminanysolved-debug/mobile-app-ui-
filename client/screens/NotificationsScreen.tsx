import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "achievement" | "social" | "system" | "reward";
  read: boolean;
  actionType?: string;
  actionData?: any;
};

const getNotificationIcon = (type: string): keyof typeof Feather.glyphMap => {
  switch (type) {
    case "achievement":
      return "award";
    case "social":
      return "users";
    case "reward":
      return "gift";
    default:
      return "bell";
  }
};

const getNotificationGradient = (type: string): [string, string] => {
  switch (type) {
    case "achievement":
      return ["#EAB308", "#F59E0B"];
    case "social":
      return ["#8B5CF6", "#A855F7"];
    case "reward":
      return ["#22C55E", "#10B981"];
    default:
      return ["#3B82F6", "#60A5FA"];
  }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(new URL('/api/notifications', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await fetch(new URL('/api/notifications/read-all', getApiUrl()).toString(), {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!notification.read) {
      try {
        await fetch(new URL(`/api/notifications/${notification.id}/read`, getApiUrl()).toString(), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    switch (notification.type) {
      case "achievement":
        setSelectedNotification(notification);
        setModalVisible(true);
        break;
      case "social":
        setSelectedNotification(notification);
        setModalVisible(true);
        break;
      case "reward":
        navigation.navigate("MainTabs" as any);
        break;
      case "system":
      default:
        setSelectedNotification(notification);
        setModalVisible(true);
        break;
    }
  };

  const handleModalAction = () => {
    setModalVisible(false);
    if (selectedNotification) {
      switch (selectedNotification.type) {
        case "achievement":
          navigation.navigate("MainTabs" as any);
          break;
        case "social":
          navigation.navigate("MainTabs" as any);
          break;
        case "reward":
          navigation.navigate("MainTabs" as any);
          break;
        default:
          break;
      }
    }
    setSelectedNotification(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="h3">Notifications</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {unreadCount > 0 ? `${unreadCount} new notifications` : "All caught up!"}
              </ThemedText>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                onPress={handleMarkAllRead}
                style={[styles.markAllButton, { backgroundColor: "rgba(45, 39, 82, 0.6)" }]}
              >
                <Feather name="check-circle" size={16} color="#A78BFA" />
                <ThemedText type="xs" style={{ color: "#A78BFA", marginLeft: 4 }}>
                  Mark all read
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        <AdBanner variant="compact" />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
          </View>
        ) : notifications.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.emptyCard, { backgroundColor: "rgba(45, 39, 82, 0.6)" }]}>
              <Feather name="bell-off" size={48} color={theme.textMuted} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                No notifications yet
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                You'll be notified about achievements and updates
              </ThemedText>
            </View>
          </Animated.View>
        ) : (
          notifications.map((notification, index) => (
            <Animated.View
              key={notification.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Pressable
                onPress={() => handleNotificationPress(notification)}
                style={({ pressed }) => [
                  styles.notificationCard,
                  { backgroundColor: "rgba(45, 39, 82, 0.6)" },
                  !notification.read
                    ? { borderLeftWidth: 3, borderLeftColor: "#A78BFA" }
                    : null,
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                <LinearGradient
                  colors={getNotificationGradient(notification.type)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <Feather
                    name={getNotificationIcon(notification.type)}
                    size={18}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View style={styles.notificationContent}>
                  <ThemedText
                    type="body"
                    style={[
                      styles.notificationTitle,
                      !notification.read ? { fontWeight: "700" } : null,
                    ]}
                  >
                    {notification.title}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {notification.description}
                  </ThemedText>
                  <ThemedText type="xs" style={{ color: theme.textMuted }}>
                    {notification.time}
                  </ThemedText>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.read ? (
                    <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
                  ) : null}
                  <Feather name="chevron-right" size={16} color={theme.textMuted} />
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}
          >
            {selectedNotification ? (
              <>
                <LinearGradient
                  colors={getNotificationGradient(selectedNotification.type)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIconContainer}
                >
                  <Feather
                    name={getNotificationIcon(selectedNotification.type)}
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <ThemedText type="h3" style={styles.modalTitle}>
                  {selectedNotification.title}
                </ThemedText>
                <ThemedText
                  type="body"
                  style={[styles.modalDescription, { color: theme.textSecondary }]}
                >
                  {selectedNotification.description}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xl }}>
                  {selectedNotification.time}
                </ThemedText>
                <View style={styles.modalButtons}>
                  <Button
                    variant="outline"
                    onPress={() => setModalVisible(false)}
                    style={styles.modalButton}
                  >
                    Dismiss
                  </Button>
                  <Button
                    onPress={handleModalAction}
                    style={styles.modalButton}
                  >
                    View Details
                  </Button>
                </View>
              </>
            ) : null}
          </Animated.View>
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
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  loadingContainer: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  emptyCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
  },
});
