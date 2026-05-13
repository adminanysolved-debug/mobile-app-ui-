import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
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
import { auth } from "@/lib/firebase";
import { useSafeScrollPadding } from "@/hooks/useSafeArea";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route?: string;
  iconBg?: string;
  iconColor: string;
  danger?: boolean;
};

const ordersItems: MenuItem[] = [
  {
    icon: "shopping-bag",
    label: "My Purchase",
    route: "Market",
    iconColor: "#C4B5FD",
  },
  {
    icon: "credit-card",
    label: "My Wallet",
    route: "Wallet",
    iconColor: "#C4B5FD",
  },
];

const accountItems: MenuItem[] = [
  {
    icon: "edit-2",
    label: "Edit Profile",
    route: "EditProfile",
    iconColor: "#60A5FA",
  },
  {
    icon: "log-out",
    label: "Sign Out",
    route: "SignOut",
    iconColor: "#FBBF24",
  },
  {
    icon: "trash-2",
    label: "Delete Account",
    route: "DeleteAccount",
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
      style={[
        styles.menuRow,
        !isLast
          ? { borderBottomWidth: 1, borderBottomColor: theme.border }
          : null,
      ]}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: item.iconBg || "rgba(0,0,0,0.05)" },
        ]}
      >
        <Feather name={item.icon} size={20} color={item.iconColor} />
      </View>
      <ThemedText
        type="body"
        style={[styles.menuLabel, item.danger ? { color: "#DC2626" } : null]}
      >
        {item.label}
      </ThemedText>
      <Feather name="chevron-right" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

function PuzzleCover({ imageUrl, progress, onUpload, isOwnProfile }: { imageUrl: string | null; progress: number; onUpload?: () => void; isOwnProfile: boolean }) {
  const { theme } = useTheme();
  const pieces = 9; // 3x3 grid
  const revealedPieces = Math.floor((progress / 100) * pieces);
  
  return (
    <Pressable 
      onPress={isOwnProfile ? onUpload : undefined}
      style={styles.puzzleContainer}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.puzzleImage} />
      ) : (
        <LinearGradient
          colors={["#1A1040", "#2D1B4E"]}
          style={styles.puzzleImage}
        >
          <View style={styles.puzzlePlaceholder}>
            <Feather name="image" size={32} color="rgba(255,255,255,0.2)" />
            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
              {isOwnProfile ? "Tap to add cover" : "No cover image"}
            </ThemedText>
          </View>
        </LinearGradient>
      )}
      
      <View style={styles.gridOverlay}>
        {Array.from({ length: pieces }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.puzzlePiece,
              { 
                opacity: i < revealedPieces ? 0 : 0.95,
                backgroundColor: theme.backgroundRoot 
              }
            ]} 
          >
            {i >= revealedPieces && (
              <Feather name="lock" size={14} color="rgba(255,255,255,0.15)" />
            )}
          </View>
        ))}
      </View>
      
      <LinearGradient
        colors={["transparent", "rgba(13, 11, 30, 0.8)"]}
        style={styles.puzzleGradient}
      />

      {isOwnProfile && (
        <View style={styles.coverEditBadge}>
          <Feather name="camera" size={12} color="#FFF" />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const safePadding = useSafeScrollPadding();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, currentTheme } = useTheme();
  const { user, logout, token, updateUser, refreshUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAge, setEditAge] = useState(user?.age?.toString() || "");
  const [editGender, setEditGender] = useState(user?.gender || "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    user?.profilePhoto || user?.profileImage || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const targetUserId = route.params?.userId || user?.id;
  const isOwnProfile = !route.params?.userId || route.params?.userId === user?.id;

  const fetchProfile = async () => {
    if (!token || !targetUserId) return;
    setIsLoading(true);
    try {
      const response = await fetch(new URL(`/api/users/${targetUserId}`, getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (isOwnProfile) {
          updateUser(data.user || data);
          setOverallProgress(data.overallProgress || 0);
          setOtherUser(null); // Clear stale data
        } else {
          setOtherUser(data.user || data);
          setOverallProgress(data.overallProgress || 0);
          setIsFollowing(data.isFollowing || false);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const handleFollowToggle = async () => {
    if (!token || !targetUserId || isOwnProfile) return;
    setIsUpdatingFollow(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(new URL(`/api/users/${targetUserId}/follow`, getApiUrl()).toString(), {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to follow/unfollow:", error);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  // Sync profilePhoto local state whenever the user context changes
  useEffect(() => {
    const currentUser = isOwnProfile ? user : otherUser;
    setProfilePhoto(currentUser?.profilePhoto || currentUser?.profileImage || null);
  }, [user, otherUser, isOwnProfile]);

  useEffect(() => {
    if (route.params?.isEditing) {
      setEditFullName(user?.fullName || "");
      setEditBio(user?.bio || "");
      setEditAge(user?.age?.toString() || "");
      setEditGender(user?.gender || "");
      setShowEditModal(true);
    }
  }, [route.params?.isEditing, user]);

  // 3D Animated Avatar logic
  const avatarTranslateY = useSharedValue(-150);
  const avatarTranslateX = useSharedValue(-60);
  const avatarRotation = useSharedValue(0);

  useEffect(() => {
    // Jump over username to the top of the profile card
    avatarTranslateY.value = withDelay(
      300,
      withSpring(-10, { damping: 6, stiffness: 80 }),
    );
    avatarTranslateX.value = withDelay(
      300,
      withSpring(30, { damping: 6, stiffness: 80 }, () => {
        // Wave hand after landing
        avatarRotation.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: 150 }),
            withTiming(15, { duration: 150 }),
            withTiming(-15, { duration: 150 }),
            withTiming(0, { duration: 150 }),
          ),
          3,
        );
      }),
    );
  }, []);

  const animated3DAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: avatarTranslateX.value },
      { translateY: avatarTranslateY.value },
      { rotate: `${avatarRotation.value}deg` },
    ],
    position: "absolute",
    top: -55,
    right: 20,
    zIndex: 999,
  }));

  const handleNavigate = (route?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route === "SignOut") {
      handleLogout();
    } else if (route === "EditProfile") {
      setEditFullName(user?.fullName || "");
      setEditBio(user?.bio || "");
      setEditAge(user?.age?.toString() || "");
      setEditGender(user?.gender || "");
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

  const showPhotoOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Upload New Photo", "Remove Profile Photo"],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage();
          } else if (buttonIndex === 2) {
            handleRemovePhoto();
          }
        },
      );
    } else {
      setShowPhotoOptionsModal(true);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
    setShowPhotoOptionsModal(false);
  };

  const handlePickCoverImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking cover image:", error);
    }
  };

  const uploadCoverImage = async (uri: string) => {
    if (!token) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "cover.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("coverImage", blob, filename);
      } else {
        formData.append("coverImage", { uri, name: filename, type } as any);
      }

      const response = await fetch(
        new URL("/api/profile/cover", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        updateUser({ ...user, coverImage: data.coverImageUrl });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    if (!token) {
      alert("Please sign in to upload a photo");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create form data
      const formData = new FormData();
      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("profilePhoto", blob, filename);
      } else {
        formData.append("profilePhoto", {
          uri,
          name: filename,
          type,
        } as any);
      }

      // Upload to server with fresh token
      const response = await fetch(
        new URL("/api/profile/photo", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProfilePhoto(data.profilePhotoUrl);
        updateUser({
          ...user,
          profilePhoto: data.profilePhotoUrl,
          profileImage: data.profilePhotoUrl,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const errorData = await response.json();
        alert(`Failed to upload photo: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!token) {
      alert("Please sign in to remove photo");
      return;
    }

    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsUploadingPhoto(true);
            try {
              const response = await fetch(
                new URL("/api/profile/photo", getApiUrl()).toString(),
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (response.ok) {
                updateUser({ profilePhoto: undefined });
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } else {
                const errorData = await response.json();
                alert(
                  `Failed to remove photo: ${errorData.error || "Unknown error"}`,
                );
              }
            } catch (error) {
              console.error("Error removing photo:", error);
              alert("Failed to remove photo. Please try again.");
            } finally {
              setIsUploadingPhoto(false);
              setShowPhotoOptionsModal(false);
            }
          },
        },
      ],
    );
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        new URL("/api/profile", getApiUrl()).toString(),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: editFullName,
            bio: editBio,
            age: editAge ? parseInt(editAge) : null,
            gender: editGender || null,
          }),
        },
      );
      if (response.ok) {
        // Fetch fresh user data from backend so the profile card updates immediately
        await refreshUser();
        setShowEditModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        new URL("/api/profile", getApiUrl()).toString(),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        await logout();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <GalaxyBackground>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.link} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>
          {isOwnProfile ? "My Profile" : `@${otherUser?.username || "Profile"}`}
        </ThemedText>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, safePadding]}
        showsVerticalScrollIndicator={false}
      >
        <PuzzleCover 
          imageUrl={isOwnProfile ? user?.coverImage : otherUser?.coverImage} 
          progress={overallProgress}
          isOwnProfile={isOwnProfile}
          onUpload={handlePickCoverImage}
        />

        <Animated.View
          entering={FadeInDown.springify()}
          style={{ position: "relative" }}
        >
          <Animated.Image
            source={{
              uri: "https://static.vecteezy.com/system/resources/thumbnails/023/125/465/small_2x/3d-illustration-of-an-astronaut-waving-isolated-on-a-transparent-background-png.png",
            }}
            style={[{ width: 120, height: 120 }, animated3DAvatarStyle]}
            resizeMode="contain"
          />
          <Card style={styles.profileCard}>
            <View style={styles.profileContainer}>
              {/* Profile Photo with Upload Button - LEFT SIDE */}
              <View style={styles.avatarSection}>
                <Pressable
                  onPress={isOwnProfile ? showPhotoOptions : undefined}
                  style={styles.avatarContainer}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatar}
                    >
                      <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
                        {(isOwnProfile ? user : otherUser)?.fullName?.charAt(0) || (isOwnProfile ? user : otherUser)?.username?.charAt(0) || "?"}
                      </ThemedText>
                    </LinearGradient>
                  )}

                  {/* Camera Icon Overlay - Only for own profile */}
                  {isOwnProfile && (
                    <View style={styles.cameraIconContainer}>
                      <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cameraIcon}
                      >
                        {isUploadingPhoto ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Feather name="camera" size={16} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Profile Info - RIGHT SIDE */}
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <ThemedText
                    type="xs"
                    style={[
                      styles.profileLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    USERNAME
                  </ThemedText>
                  <ThemedText type="h3" style={styles.username}>
                    @{(isOwnProfile ? user : otherUser)?.username || "user"}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Full Name
                  </ThemedText>
                  <ThemedText type="body" style={styles.fullName}>
                    {(isOwnProfile ? user : otherUser)?.fullName || "User"}
                  </ThemedText>
                </View>

                {(isOwnProfile ? user : otherUser)?.age ? (
                  <View style={styles.infoRow}>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      Age
                    </ThemedText>
                    <ThemedText type="body">{(isOwnProfile ? user : otherUser)?.age}</ThemedText>
                  </View>
                ) : null}

                {(isOwnProfile ? user : otherUser)?.gender ? (
                  <View style={styles.infoRow}>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      Gender
                    </ThemedText>
                    <ThemedText type="body">{(isOwnProfile ? user : otherUser)?.gender}</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {(isOwnProfile ? user : otherUser)?.bio ? (
              <View
                style={[
                  styles.bioSection,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{ color: theme.textSecondary, fontStyle: "italic" }}
                >
                  {(isOwnProfile ? user : otherUser)?.bio}
                </ThemedText>
              </View>
            ) : null}

            {/* Wallet Stats Section */}
            <View
              style={[
                styles.statsSection,
                { borderTopWidth: 1, borderTopColor: theme.border },
              ]}
            >
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.yellow }}>
                  {(isOwnProfile ? user : otherUser)?.coins || 0}
                </ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                  COINS
                </ThemedText>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: theme.border }]}
              />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.link }}>
                  {(isOwnProfile ? user : otherUser)?.trophies || 0}
                </ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                  TROPHIES
                </ThemedText>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: theme.border }]}
              />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.accent }}>
                  {(isOwnProfile ? user : otherUser)?.totalPoints || 0}
                </ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                  XP POINTS
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Social Actions - ONLY for other users */}
        {!isOwnProfile && otherUser && (
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.socialActions}
          >
            <Button
              onPress={handleFollowToggle}
              disabled={isUpdatingFollow}
              style={[
                styles.socialButton,
                { backgroundColor: isFollowing ? theme.backgroundSecondary : theme.link }
              ]}
            >
              <View style={styles.buttonContent}>
                <Feather name={isFollowing ? "user-check" : "user-plus"} size={18} color={isFollowing ? theme.textSecondary : "#FFFFFF"} />
                <ThemedText style={{ color: isFollowing ? theme.textSecondary : "#FFFFFF", fontWeight: '700', marginLeft: 8 }}>
                  {isFollowing ? "Following" : "Follow"}
                </ThemedText>
              </View>
            </Button>
            
            <Button
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Home", { 
                  screen: "CreateDream", 
                  params: { type: 'challenge', opponentId: otherUser.id } 
                });
              }}
              variant="outline"
              style={[styles.socialButton, { borderColor: theme.accent }]}
            >
              <View style={styles.buttonContent}>
                <Feather name="zap" size={18} color={theme.accent} />
                <ThemedText style={{ color: theme.accent, fontWeight: '700', marginLeft: 8 }}>
                  Challenge
                </ThemedText>
              </View>
            </Button>
          </Animated.View>
        )}

        {/* Privacy Notice */}
        {(isOwnProfile ? user : otherUser)?.isPrivate && !isOwnProfile && (
          <Card style={{ padding: Spacing.lg, alignItems: "center", gap: Spacing.sm, marginTop: Spacing.md }}>
            <Feather name="lock" size={32} color="#A78BFA" />
            <ThemedText type="body" style={{ textAlign: "center", color: "#C4B5FD" }}>
              This account is private. Follow to see their achievements and dreams.
            </ThemedText>
          </Card>
        )}

        {(!(isOwnProfile ? user : otherUser)?.isPrivate || isOwnProfile) && (
          <>
            <AdBanner variant="compact" />

            {isOwnProfile && (
              <>
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
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h3" style={styles.modalTitle}>
              Edit Profile
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.inputLabel, { color: theme.textSecondary }]}
            >
              Full Name
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText
              type="small"
              style={[styles.inputLabel, { color: theme.textSecondary }]}
            >
              Age
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              value={editAge}
              onChangeText={setEditAge}
              placeholder="Enter your age"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
            />
            <ThemedText
              type="small"
              style={[styles.inputLabel, { color: theme.textSecondary }]}
            >
              Gender
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              value={editGender}
              onChangeText={setEditGender}
              placeholder="Enter your gender"
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText
              type="small"
              style={[styles.inputLabel, { color: theme.textSecondary }]}
            >
              Bio
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.bioInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={[styles.modalButton, { borderColor: theme.border }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Button
                onPress={handleSaveProfile}
                disabled={isLoading}
                style={styles.saveButton}
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h3" style={styles.modalTitle}>
              Delete Account
            </ThemedText>
            <ThemedText
              type="body"
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginBottom: Spacing.xl,
              }}
            >
              Are you sure you want to delete your account? This action cannot
              be undone.
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={[styles.modalButton, { borderColor: theme.border }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDeleteAccount}
                style={[styles.deleteButton]}
              >
                <ThemedText type="body" style={{ color: theme.text }}>
                  {isLoading ? "Deleting..." : "Delete"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Options Modal for Android */}
      <Modal visible={showPhotoOptionsModal} animationType="fade" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPhotoOptionsModal(false)}
        >
          <View
            style={[
              styles.photoOptionsContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h3" style={styles.modalTitle}>
              Profile Photo
            </ThemedText>
            <Pressable
              onPress={handlePickImage}
              style={[
                styles.photoOptionButton,
                { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <Feather name="upload" size={20} color={theme.text} />
              <ThemedText type="body" style={styles.photoOptionText}>
                Upload New Photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleRemovePhoto}
              style={styles.photoOptionButton}
            >
              <Feather name="trash-2" size={20} color="#DC2626" />
              <ThemedText
                type="body"
                style={[styles.photoOptionText, { color: "#DC2626" }]}
              >
                Remove Profile Photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setShowPhotoOptionsModal(false)}
              style={[
                styles.cancelButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="body">Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
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
  profileCard: {
    padding: Spacing.xl,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  cameraIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(45, 39, 82, 0.8)",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  infoRow: {
    marginBottom: Spacing.xs,
  },
  profileLabel: {
    marginBottom: 2,
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
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  textInput: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  bioSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statsSection: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    opacity: 0.2,
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
  photoOptionsContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
  },
  photoOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  photoOptionText: {
    fontSize: 16,
  },
  cancelButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  socialActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: 2,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: Spacing.md,
  },
  puzzleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  puzzlePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  puzzlePiece: {
    width: "33.33%",
    height: "33.33%",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  puzzleGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverEditBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: BorderRadius.full,
  },
});
