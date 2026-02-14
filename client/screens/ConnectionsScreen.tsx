import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type TabType = "followers" | "following" | "discover";

type Connection = {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
  isFollowing?: boolean;
};

export default function ConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("followers");
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [discoverUsers, setDiscoverUsers] = useState<Connection[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(new URL('/api/connections', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const fetchDiscoverUsers = useCallback(async () => {
    if (!token || !searchQuery.trim()) {
      setDiscoverUsers([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        new URL(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, getApiUrl()).toString(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setDiscoverUsers(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    if (activeTab === "discover" && searchQuery.trim()) {
      const debounce = setTimeout(() => {
        fetchDiscoverUsers();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, activeTab, fetchDiscoverUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConnections();
  };

  const handleFollow = async (userId: string) => {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetch(new URL(`/api/connections/${userId}/follow`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConnections();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetch(new URL(`/api/connections/${userId}/unfollow`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConnections();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const connections = activeTab === "followers" ? followers : activeTab === "following" ? following : discoverUsers;

  const renderConnection = ({ item, index }: { item: Connection; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Card style={styles.connectionCard}>
        <LinearGradient
          colors={[theme.blue, theme.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <ThemedText style={styles.avatarText}>
            {item.fullName?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </LinearGradient>
        <View style={styles.userInfo}>
          <ThemedText type="bodyMedium">{item.fullName}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            @{item.username}
          </ThemedText>
        </View>
        {activeTab === "followers" && (
          item.isFollowing ? (
            <Pressable
              onPress={() => handleUnfollow(item.id)}
              style={[styles.followButton, styles.followingButton]}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Following
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleFollow(item.id)}
              style={[styles.followButton, { backgroundColor: theme.link }]}
            >
              <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                Follow
              </ThemedText>
            </Pressable>
          )
        )}

        {activeTab === "following" && (
          <Pressable
            onPress={() => handleUnfollow(item.id)}
            style={[styles.followButton, styles.followingButton]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Unfollow
            </ThemedText>
          </Pressable>
        )}
        {activeTab === "discover" && (
          item.isFollowing ? (
            <Pressable
              onPress={() => handleUnfollow(item.id)}
              style={[styles.followButton, styles.followingButton]}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Following
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleFollow(item.id)}
              style={[styles.followButton, { backgroundColor: theme.link }]}
            >
              <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                Follow
              </ThemedText>
            </Pressable>
          )
        )}
      </Card>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary, marginTop: headerHeight + Spacing.lg }]}>
        <Pressable
          onPress={() => setActiveTab("followers")}
          style={[styles.tab, activeTab === "followers" ? styles.tabActive : null]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              activeTab === "followers" ? styles.tabTextActive : { color: theme.textSecondary },
            ]}
          >
            Followers ({followers.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("following")}
          style={[styles.tab, activeTab === "following" ? styles.tabActive : null]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              activeTab === "following" ? styles.tabTextActive : { color: theme.textSecondary },
            ]}
          >
            Following ({following.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("discover")}
          style={[styles.tab, activeTab === "discover" ? styles.tabActive : null]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              activeTab === "discover"
                ? styles.tabTextActive
                : { color: theme.textSecondary },
            ]}
          >
            Discover
          </ThemedText>
        </Pressable>
      </View>
      {activeTab === "discover" && (
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="search" size={20} color={theme.textMuted} />

          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      )}
      {(isLoading || isSearching) ? (
        <ActivityIndicator size="large" color={theme.link} style={{ marginTop: Spacing["3xl"] }} />
      ) : connections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={48} color={theme.textMuted} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            {activeTab === "followers"
              ? "No followers yet"
              : activeTab === "following"
                ? "Not following anyone"
                : searchQuery
                  ? "No users found"
                  : "Search for users to follow"}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          renderItem={renderConnection}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
  },
  tabActive: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  searchContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: Spacing.lg,
  marginTop: Spacing.md,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  borderRadius: BorderRadius.sm,
  gap: Spacing.sm,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: Spacing.xs,
},
});
