import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
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
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

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

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedImageUri || !token) return;
    setIsPosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Upload image first via profile photo endpoint (reuse cloudinary pipeline)
      const formData = new FormData();
      const filename = selectedImageUri.split("/").pop() || "gallery.jpg";
      const ext = /\.(\w+)$/.exec(filename);
      const type = ext ? `image/${ext[1]}` : "image/jpeg";
      formData.append("profilePhoto", { uri: selectedImageUri, name: filename, type } as any);
      const uploadRes = await fetch(new URL("/api/profile/photo", getApiUrl()).toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const { profilePhotoUrl } = await uploadRes.json();

      // Create gallery post
      const res = await fetch(new URL('/api/gallery', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: profilePhotoUrl, caption: caption.trim() || null }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowCreateModal(false);
        setCaption("");
        setSelectedImageUri(null);
        fetchGalleryPosts();
      } else {
        const err = await res.json();
        Alert.alert("Failed", err.error || "Could not create post");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

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

  const navigation = useNavigation<any>();

  return (
    <GalaxyBackground>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.link} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>
          Gallery
        </ThemedText>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + SCROLL_BOTTOM_EXTRA,
          },
        ]}
        showsVerticalScrollIndicator={true}
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
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.itemImage} />
                  ) : (
                    <LinearGradient
                      colors={getGradient(post.dream?.type)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.itemContent}
                    />
                  )}
                  <View style={styles.itemOverlay}>
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
                  </View>
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

      {/* FAB */}
      {token && (
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowCreateModal(true);
          }}
          testID="button-create-gallery-post"
        >
          <LinearGradient
            colors={["#8B5CF6", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Feather name="camera" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      )}

      {/* Create Post Modal */}
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
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">New Gallery Post</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Image Picker */}
            <Pressable onPress={handlePickImage} style={[styles.imagePicker, { borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <LinearGradient colors={["#8B5CF6", "#A855F7"]} style={styles.imagePickerIcon}>
                    <Feather name="image" size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Tap to pick image</ThemedText>
                </View>
              )}
            </Pressable>

            <TextInput
              style={[styles.captionInput, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              placeholder="Add a caption... (optional)"
              placeholderTextColor={theme.textMuted}
              value={caption}
              onChangeText={setCaption}
              maxLength={120}
              multiline
            />

            <View style={styles.modalActions}>
              <Button
                onPress={() => { setShowCreateModal(false); setSelectedImageUri(null); setCaption(""); }}
                variant="secondary"
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleCreatePost}
                disabled={!selectedImageUri || isPosting}
                style={styles.postButton}
                testID="button-submit-gallery-post"
              >
                {isPosting ? "Posting..." : "Share"}
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
    height: 180,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemContent: {
    width: "100%",
    height: "100%",
  },
  itemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
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
  fab: {
    position: "absolute",
    right: Spacing.xl,
    bottom: 100,
    borderRadius: BorderRadius.full,
    elevation: 8,
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imagePicker: {
    height: 180,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  imagePickerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 72,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  postButton: {
    flex: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
