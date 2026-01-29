import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type NewsFeedPost = {
  id: string;
  userId: string;
  dreamId: string | null;
  content: string;
  imageUrl: string | null;
  likes: number;
  comments: number;
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
  personal: ["#8B5CF6", "#A855F7"],
  challenge: ["#22C55E", "#10B981"],
  group: ["#EAB308", "#F59E0B"],
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

export default function NewsFeedScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [feedPosts, setFeedPosts] = useState<NewsFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchNewsFeed = async () => {
    try {
      const response = await fetch(new URL('/api/news-feed', getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setFeedPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch news feed:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNewsFeed();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !token) return;
    
    setIsPosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch(new URL('/api/news-feed', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
        }),
      });
      
      if (response.ok) {
        setNewPostContent("");
        setShowCreateModal(false);
        fetchNewsFeed();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (likedPosts.has(postId)) return;
    
    try {
      const response = await fetch(new URL(`/api/news-feed/${postId}/like`, getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setLikedPosts(prev => new Set([...prev, postId]));
        setFeedPosts(prev => 
          prev.map(post => 
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNewsFeed();
  };

  const getGradient = (type: string | undefined): [string, string] => {
    return typeGradients[type || "personal"] || ["#6B7280", "#9CA3AF"];
  };

  const displayPosts = feedPosts.length > 0 ? feedPosts : [];

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedText type="h3" style={styles.title}>
            Community Feed
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            See what others are achieving
          </ThemedText>
        </Animated.View>

        <AdBanner />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        ) : displayPosts.length > 0 ? (
          displayPosts.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Card style={styles.postCard}>
                <View style={styles.postHeader}>
                  <LinearGradient
                    colors={getGradient(post.dream?.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Feather name="user" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.userInfo}>
                    <ThemedText type="body" style={styles.userName}>
                      {post.user?.fullName || post.user?.username || "Anonymous"}
                    </ThemedText>
                    <ThemedText type="xs" style={{ color: theme.textMuted }}>
                      {formatTimeAgo(post.createdAt)}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="body" style={styles.postContent}>
                  {post.content}
                </ThemedText>

                {post.dream ? (
                  <View style={[styles.achievementBadge, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="award" size={14} color={theme.yellow} />
                    <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.xs }}>
                      {post.dream.title}
                    </ThemedText>
                  </View>
                ) : null}

                <View style={[styles.postActions, { borderTopColor: "rgba(139, 127, 199, 0.3)" }]}>
                  <Pressable
                    onPress={() => handleLike(post.id)}
                    style={styles.actionButton}
                  >
                    <Feather 
                      name={likedPosts.has(post.id) ? "heart" : "heart"} 
                      size={18} 
                      color={likedPosts.has(post.id) ? theme.error : theme.textSecondary} 
                    />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {post.likes}
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Feather name="message-circle" size={18} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {post.comments}
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Feather name="share" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ))
        ) : (
          <Animated.View
            style={styles.emptyStateContainer}
            entering={FadeInDown.springify()}
          >
            <View style={styles.emptyStateContent}>
              <Feather name="inbox" size={48} color={theme.textSecondary} />
              <ThemedText type="h4" style={styles.emptyStateTitle}>
                No posts yet
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.emptyStateText, { color: theme.textSecondary }]}
              >
                Be the first to share your dream achievements with the community!
              </ThemedText>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: theme.link }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreateModal(true);
        }}
        testID="button-create-post"
      >
        <LinearGradient
          colors={["#8B5CF6", "#A855F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCreateModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Create Post</ThemedText>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            
            <View style={styles.composerHeader}>
              <LinearGradient
                colors={["#8B5CF6", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.composerAvatar}
              >
                <Feather name="user" size={16} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText type="body" style={styles.composerName}>
                {user?.fullName || user?.username || "You"}
              </ThemedText>
            </View>
            
            <TextInput
              style={[
                styles.postInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: "rgba(139, 127, 199, 0.3)",
                },
              ]}
              placeholder="Share your dreams, achievements, or thoughts with the community..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={5}
              value={newPostContent}
              onChangeText={setNewPostContent}
              textAlignVertical="top"
              testID="input-post-content"
            />
            
            <ThemedText type="xs" style={[styles.charCount, { color: theme.textMuted }]}>
              {newPostContent.length}/500 characters
            </ThemedText>
            
            <View style={styles.modalActions}>
              <Button
                onPress={() => {
                  setNewPostContent("");
                  setShowCreateModal(false);
                }}
                variant="secondary"
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || isPosting || newPostContent.length > 500}
                style={styles.postButton}
                testID="button-submit-post"
              >
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  postCard: {
    padding: Spacing.lg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  postContent: {
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyStateContent: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  emptyStateTitle: {
    marginTop: Spacing.md,
  },
  emptyStateText: {
    textAlign: "center",
    maxWidth: 280,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    bottom: 100,
    borderRadius: BorderRadius.full,
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  composerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  composerName: {
    fontWeight: "600",
  },
  postInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  postButton: {
    flex: 2,
  },
});
