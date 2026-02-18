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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

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
  const tabBarHeight = useBottomTabBarHeight();
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

  // --- AAPKA EXISTING LOGIC (Unchanged) ---
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

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

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
    try {
      await fetch(new URL(`/api/connections/${userId}/follow`, getApiUrl()).toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConnections();
    } catch (error) { console.error('Error following user:', error); }
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
    } catch (error) { console.error('Error unfollowing user:', error); }
  };

  const connections = activeTab === "followers" ? followers : activeTab === "following" ? following : discoverUsers;

  // --- INSTAGRAM STYLE COMPONENTS ---

  const renderHeader = () => (
    <View style={{ backgroundColor: theme.background }}>
      {/* 1. TABS (Sticky Area) */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.backgroundSecondary }]}>
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

      {/* 2. SEARCH BAR (Only for Discover) */}
      {activeTab === "discover" && (
        <View style={[styles.searchWrapper, { backgroundColor: theme.background }]}>
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
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );

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
      {/* Content Wrapper for Android Overlap Fix */}
      <View style={{ flex: 1, marginTop: headerHeight }}>
        <FlatList
          data={connections}
          showsVerticalScrollIndicator={true}
          keyExtractor={(item) => item.id}
          renderItem={renderConnection}
          ListHeaderComponent={renderHeader}
          stickyHeaderIndices={[0]} // Instagram-like sticky tabs
          contentContainerStyle={{
            paddingBottom: tabBarHeight + insets.bottom + 140,
            flexGrow: 1,
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