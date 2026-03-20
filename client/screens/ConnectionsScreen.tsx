import { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
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
  const route = useRoute<any>();
  
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab || "followers");

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [discoverUsers, setDiscoverUsers] = useState<Connection[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ BUG FIX 1: Track latest fetch call to discard stale responses.
  // Without this, rapid follows trigger multiple fetchConnections() calls.
  // If the OLDER call resolves AFTER the newer one, it overwrites the correct
  // following list (e.g. [A, B]) with stale data (e.g. [A]) — making B appear
  // "unfollowed" when it was never unfollowed.
  const fetchConnectionsTokenRef = useRef(0);

  // --- AAPKA EXISTING LOGIC (Unchanged) ---
  const fetchConnections = useCallback(async () => {
    if (!token) return;
    // Increment token and capture this call's token
    const callToken = ++fetchConnectionsTokenRef.current;
    try {
      const response = await fetch(new URL('/api/connections', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Only apply if this is still the latest call (discard stale responses)
        if (callToken === fetchConnectionsTokenRef.current) {
          setFollowers(data.followers || []);
          setFollowing(data.following || []);
        }
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      if (callToken === fetchConnectionsTokenRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, [token]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // ✅ BUG FIX 2: Sync discoverUsers.isFollowing from the authoritative `following`
  // list whenever it changes. This ensures the Discover tab always reflects the
  // true follow state after any follow/unfollow action completes — preventing the
  // "Follow" button from remaining active on already-followed users.
  useEffect(() => {
    if (discoverUsers.length === 0) return;
    const followingIdSet = new Set(following.map((u) => u.id));
    setDiscoverUsers((prev) =>
      prev.map((u) => ({ ...u, isFollowing: followingIdSet.has(u.id) }))
    );
    // NOTE: `discoverUsers` intentionally NOT in deps — this effect only syncs
    // from `following`, not the other way around, to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [following]);

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
      const debounce = setTimeout(() => { fetchDiscoverUsers(); }, 500);
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

    // ✅ BUG FIX 3: Optimistic update — immediately mark as following in the
    // Discover list. Without this, after following User A, A's button still
    // shows "Follow" (isFollowing: false) because discoverUsers is a stale
    // snapshot from the search response. The user cannot tell A was followed,
    // and may tap A again, OR believe that following a second user "undid" the
    // first — even though both are correctly stored on the backend.
    setDiscoverUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
    );

    try {
      const response = await fetch(new URL(`/api/connections/${userId}/follow`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        // Sync authoritative state from server
        fetchConnections();
      } else {
        // Revert optimistic update if the server rejected the request
        // (e.g. 400 "Already following" or 500 error)
        setDiscoverUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
        );
        const err = await response.json().catch(() => ({}));
        console.warn('Follow failed:', response.status, err);
      }
    } catch (error) {
      // Revert optimistic update on network error
      setDiscoverUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // ✅ Optimistic update for unfollow — mirrors the same pattern as handleFollow
    setDiscoverUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
    );

    try {
      const response = await fetch(new URL(`/api/connections/${userId}/unfollow`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchConnections();
      } else {
        // Revert if server rejected
        setDiscoverUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
        );
        console.warn('Unfollow failed:', response.status);
      }
    } catch (error) {
      // Revert on network error
      setDiscoverUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );
      console.error('Error unfollowing user:', error);
    }
  };

  const connections = activeTab === "followers" ? followers : activeTab === "following" ? following : discoverUsers;

  const renderConnection = ({ item, index }: { item: Connection; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} style={{ paddingHorizontal: Spacing.lg }}>
      <Card style={styles.connectionCard}>
        <LinearGradient
          colors={[theme.blue, theme.purple]}
          style={styles.avatar}
        >
          <ThemedText style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase()}</ThemedText>
        </LinearGradient>
        
        <View style={styles.userInfo}>
          <ThemedText type="bodyMedium" style={{ fontWeight: '600' }}>{item.fullName}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>@{item.username}</ThemedText>
        </View>

        <Pressable
          onPress={() => item.isFollowing ? handleUnfollow(item.id) : handleFollow(item.id)}
          style={[
            styles.followButton,
            item.isFollowing ? styles.followingButton : { backgroundColor: theme.link }
          ]}
        >
          <ThemedText type="small" style={{ color: item.isFollowing ? theme.textSecondary : "#FFFFFF", fontWeight: 'bold' }}>
            {item.isFollowing ? "Following" : activeTab === 'followers' ? "Follow Back" : "Follow"}
          </ThemedText>
        </Pressable>
      </Card>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={{ flex: 1, paddingTop: Spacing.lg }}>
        {/* Fixed tabs - always visible (avoids FlatList flexGrow hiding header when empty) */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot, borderBottomColor: theme.backgroundSecondary }]}>
          {(["followers", "following", "discover"] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              style={[styles.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.link }]}
            >
              <ThemedText style={[
                styles.tabText,
                { color: activeTab === tab ? theme.link : theme.textSecondary, fontSize: 13 }
              ]}>
                {tab.toUpperCase()} {tab === 'followers' ? `(${followers.length})` : tab === 'following' ? `(${following.length})` : ''}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        {activeTab === "discover" && (
          <View style={[styles.searchWrapper, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search users..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
        <FlatList
          data={connections}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          keyExtractor={(item) => item.id}
          renderItem={renderConnection}
          contentContainerStyle={{
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + SCROLL_BOTTOM_EXTRA,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
          }
          ListEmptyComponent={
            !isLoading && !isSearching ? (
              <View style={styles.emptyContainer}>
                <Feather name="user-plus" size={50} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                <ThemedText style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
                  {activeTab === "discover" ? "Try searching for someone" : `No ${activeTab} yet`}
                </ThemedText>
              </View>
            ) : null
          }
          ListFooterComponent={(isLoading || isSearching) && connections.length > 0 ? (
            <ActivityIndicator size="small" color={theme.link} style={{ marginVertical: Spacing.md }} />
          ) : null}
        />
      </View>

      {/* Global Loading state for initial fetch */}
      {isLoading && connections.length === 0 && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.link} />
        </View>
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
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  searchWrapper: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginVertical: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  followButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
});