import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
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
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  } | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

const gradientColors: [string, string][] = [
  ["#8B5CF6", "#A855F7"],
  ["#3B82F6", "#60A5FA"],
  ["#22C55E", "#10B981"],
  ["#EAB308", "#F59E0B"],
  ["#EC4899", "#F472B6"],
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await fetch(new URL('/api/conversations', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (conversation.otherUser) {
      navigation.navigate("Chat", {
        otherUserId: conversation.otherUser.id,
        otherUserName: conversation.otherUser.fullName || conversation.otherUser.username,
      });
    }
  };

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (const conv of conversations) {
      if (conv.unreadCount > 0 && conv.otherUser) {
        try {
          await fetch(new URL('/api/messages/read-all', getApiUrl()).toString(), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ otherUserId: conv.otherUser.id }),
          });
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }
    }
    setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getGradient = (index: number): [string, string] => {
    return gradientColors[index % gradientColors.length];
  };

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

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
              <ThemedText type="h3" style={styles.title}>
                Messages
              </ThemedText>
              <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
                Stay connected with your dream community
              </ThemedText>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                onPress={handleMarkAllRead}
                style={[styles.markAllButton, { backgroundColor: theme.link + "20" }]}
                testID="button-mark-all-read"
              >
                <Feather name="check-circle" size={16} color={theme.link} />
                <ThemedText type="xs" style={{ color: theme.link, marginLeft: Spacing.xs }}>
                  Mark all read
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        <AdBanner variant="compact" />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        ) : conversations.length > 0 ? (
          conversations.map((conversation, index) => (
            <Animated.View
              key={conversation.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Pressable
                onPress={() => handleConversationPress(conversation)}
                style={[
                  styles.messageCard,
                  conversation.unreadCount > 0 ? { borderLeftWidth: 3, borderLeftColor: theme.accent } : null,
                ]}
                testID={`conversation-${conversation.id}`}
              >
                <LinearGradient
                  colors={getGradient(index)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Feather name="user" size={18} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <ThemedText
                      type="body"
                      style={[styles.senderName, conversation.unreadCount > 0 ? { fontWeight: "700" } : null]}
                    >
                      {conversation.otherUser?.fullName || conversation.otherUser?.username || "Unknown"}
                    </ThemedText>
                    <ThemedText type="xs" style={{ color: theme.textMuted }}>
                      {formatTimeAgo(conversation.lastMessageTime)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </ThemedText>
                </View>
                {conversation.unreadCount > 0 ? (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
                    <ThemedText style={styles.unreadCount}>{conversation.unreadCount}</ThemedText>
                  </View>
                ) : null}
              </Pressable>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[theme.link, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Feather name="message-circle" size={32} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              No conversations yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted, textAlign: "center" }}>
              Connect with other dreamers to start chatting
            </ThemedText>
          </View>
        )}
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
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  senderName: {
    fontWeight: "600",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontWeight: "500",
  },
});
