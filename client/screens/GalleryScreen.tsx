import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type GalleryPost = {
  id: string;
  userId: string;
  dreamId: string | null;
  imageUrl: string;
  caption: string | null;
  likes: number;
  views: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  } | null;
  dream: {
    id: string;
    title: string;
    type: string;
  } | null;
};

const typeGradients: { [key: string]: [string, string] } = {
  personal: ["#3B82F6", "#8B5CF6"],
  challenge: ["#22C55E", "#10B981"],
  group: ["#EAB308", "#F59E0B"],
};

const { width } = Dimensions.get("window");
const itemWidth = (width - Spacing.lg * 3) / 2;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGalleryPosts = async () => {
    try {
      const response = await fetch(new URL('/api/gallery', getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setGalleryPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch gallery posts:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGalleryPosts();
  }, []);

  const handleItemPress = (item: GalleryPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGalleryPosts();
  };

  const getGradient = (type: string | undefined): [string, string] => {
    return typeGradients[type || "personal"] || ["#6B7280", "#9CA3AF"];
  };

  const displayItems = galleryPosts.length > 0 ? galleryPosts : [];

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
          <ThemedText type="h3" style={styles.title}>
            Dream Gallery
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Explore achievements from our community
          </ThemedText>
        </Animated.View>

        <AdBanner />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        ) : displayItems.length > 0 ? (
          <View style={styles.gallery}>
            {displayItems.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInDown.delay(index * 60).springify()}
                style={styles.itemWrapper}
              >
                <Pressable
                  onPress={() => handleItemPress(post)}
                  style={styles.galleryItem}
                >
                  <LinearGradient
                    colors={getGradient(post.dream?.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.itemContent}
                  >
                    <View style={styles.categoryBadge}>
                      <ThemedText style={styles.categoryText}>
                        {post.dream?.type?.toUpperCase() || "DREAM"}
                      </ThemedText>
                    </View>
                    <View style={styles.itemFooter}>
                      <ThemedText style={styles.itemTitle} numberOfLines={1}>
                        {post.dream?.title || post.caption || "Achievement"}
                      </ThemedText>
                      <View style={styles.userRow}>
                        <Feather name="user" size={12} color="#FFFFFF" />
                        <ThemedText style={styles.usernameText} numberOfLines={1}>
                          {post.user?.username || "Anonymous"}
                        </ThemedText>
                      </View>
                      <View style={styles.likesContainer}>
                        <Feather name="heart" size={14} color="#FFFFFF" />
                        <ThemedText style={styles.likesText}>{post.likes}</ThemedText>
                        <Feather name="eye" size={14} color="#FFFFFF" style={{ marginLeft: Spacing.sm }} />
                        <ThemedText style={styles.likesText}>{post.views}</ThemedText>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyStateContainer}>
            <Feather name="image" size={48} color={theme.textSecondary} style={{ marginBottom: Spacing.lg }} />
            <ThemedText type="h3" style={styles.emptyStateTitle}>
              No gallery posts yet
            </ThemedText>
            <ThemedText type="body" style={[styles.emptyStateDescription, { color: theme.textSecondary }]}>
              Start sharing your dream achievements with the community
            </ThemedText>
          </Animated.View>
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
    gap: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateContainer: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyStateTitle: {
    textAlign: "center",
  },
  emptyStateDescription: {
    textAlign: "center",
    maxWidth: 280,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  itemWrapper: {
    width: itemWidth,
  },
  galleryItem: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  itemContent: {
    height: 180,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  itemFooter: {
    gap: Spacing.xs,
  },
  itemTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  usernameText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  likesText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});
