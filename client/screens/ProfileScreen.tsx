import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Image, Alert, ActionSheetIOS, Platform, ActivityIndicator } from "react-native";
//import { useSafeAreaInsets } from "react-native-safe-area-context";
//import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withDelay, withSequence, withTiming, withRepeat } from "react-native-reanimated";
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
import { useSafeScrollPadding } from '@/hooks/useSafeArea';

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

const subscriptionItem: MenuItem = {
  icon: "award",
  label: "Subscription Plan",
  route: "Subscription",
  iconBg: "rgba(99, 102, 241, 0.2)",
  iconColor: "#818cf8",
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
  const safePadding = useSafeScrollPadding();
  // const insets = useSafeAreaInsets();
  //const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme, currentTheme } = useTheme();
  const { user, logout, token, updateUser, refreshUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAge, setEditAge] = useState(user?.age?.toString() || "");
  const [editGender, setEditGender] = useState(user?.gender || "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || user?.profileImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sync profilePhoto local state whenever the user context changes (e.g., after upload or edit)
  useEffect(() => {
    setProfilePhoto(user?.profilePhoto || user?.profileImage || null);
  }, [user?.profilePhoto, user?.profileImage]);

  // 3D Animated Avatar logic
  const avatarTranslateY = useSharedValue(-150);
  const avatarTranslateX = useSharedValue(-60);
  const avatarRotation = useSharedValue(0);

  useEffect(() => {
    // Jump over username to the top of the profile card
    avatarTranslateY.value = withDelay(300, withSpring(-10, { damping: 6, stiffness: 80 }));
    avatarTranslateX.value = withDelay(300, withSpring(30, { damping: 6, stiffness: 80 }, () => {
      // Wave hand after landing
      avatarRotation.value = withRepeat(withSequence(
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(-15, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ), 3);
    }));
  }, []);

  const animated3DAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: avatarTranslateX.value },
      { translateY: avatarTranslateY.value },
      { rotate: `${avatarRotation.value}deg` }
    ],
    position: 'absolute',
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

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Upload New Photo', 'Remove Profile Photo'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage();
          } else if (buttonIndex === 2) {
            handleRemovePhoto();
          }
        }
      );
    } else {
      setShowPhotoOptionsModal(true);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
    setShowPhotoOptionsModal(false);
  };

  const uploadProfilePhoto = async (uri: string) => {
    if (!auth.currentUser) {
      alert('Please sign in to upload a photo');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Fetch fresh token from Firebase
      const freshToken = await auth.currentUser.getIdToken(true);

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('profilePhoto', blob, filename);
      } else {
        formData.append('profilePhoto', {
          uri,
          name: filename,
          type,
        } as any);
      }

      // Upload to server with fresh token
      const response = await fetch(new URL('/api/profile/photo', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePhoto(data.profilePhotoUrl);
        updateUser({ ...user, profilePhoto: data.profilePhotoUrl, profileImage: data.profilePhotoUrl });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const errorData = await response.json();
        alert(`Failed to upload photo: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to remove photo');
      return;
    }

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);
            try {
              const firebaseUser = auth.currentUser;

              if (!firebaseUser) {
                alert('Session expired. Please login again.');
                setIsUploadingPhoto(false);
                return;
              }

              // 🔥 THIS is the FIX
              const freshToken = await firebaseUser.getIdToken(true);

              const response = await fetch(
                new URL('/api/profile/photo', getApiUrl()).toString(),
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${freshToken}`,
                  },
                }
              );

              if (response.ok) {
                updateUser({ profilePhoto: undefined });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                const errorData = await response.json();
                alert(`Failed to remove photo: ${errorData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error removing photo:', error);
              alert('Failed to remove photo. Please try again.');
            } finally {
              setIsUploadingPhoto(false);
              setShowPhotoOptionsModal(false);
            }
          },
        },
      ]
    );
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
        body: JSON.stringify({
          fullName: editFullName,
          bio: editBio,
          age: editAge ? parseInt(editAge) : null,
          gender: editGender || null,
        }),
      });
      if (response.ok) {
        // Fetch fresh user data from backend so the profile card updates immediately
        await refreshUser();
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
          safePadding,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Non-sticky to prevent overlap */}
        <View style={styles.headerContainer}>
          <ThemedText
            type="xs"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            PERSONAL PROFILE
          </ThemedText>
        </View>

        <Animated.View entering={FadeInDown.springify()} style={{ position: 'relative' }}>
          <Animated.Image
            source={{ uri: 'https://static.vecteezy.com/system/resources/thumbnails/023/125/465/small_2x/3d-illustration-of-an-astronaut-waving-isolated-on-a-transparent-background-png.png' }}
            style={[{ width: 120, height: 120 }, animated3DAvatarStyle]}
            resizeMode="contain"
          />
          <Card style={styles.profileCard}>
            <View style={styles.profileContainer}>
              {/* Profile Photo with Upload Button - LEFT SIDE */}
              <View style={styles.avatarSection}>
                <Pressable onPress={showPhotoOptions} style={styles.avatarContainer}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatar}
                    >
                      <Feather name="user" size={40} color="#FFFFFF" />
                    </LinearGradient>
                  )}

                  {/* Camera Icon Overlay */}
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
                </Pressable>
              </View>

              {/* Profile Info - RIGHT SIDE */}
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <ThemedText
                    type="xs"
                    style={[styles.profileLabel, { color: theme.textSecondary }]}
                  >
                    USERNAME
                  </ThemedText>
                  <ThemedText type="h3" style={styles.username}>
                    @{user?.username || "user"}
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
                    {user?.fullName || "User"}
                  </ThemedText>
                </View>

                {user?.age ? (
                  <View style={styles.infoRow}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Age
                    </ThemedText>
                    <ThemedText type="body">
                      {user.age}
                    </ThemedText>
                  </View>
                ) : null}

                {user?.gender ? (
                  <View style={styles.infoRow}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Gender
                    </ThemedText>
                    <ThemedText type="body" style={{ textTransform: "capitalize" }}>
                      {user.gender}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {user?.bio ? (
              <View style={[styles.bioSection, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary, fontStyle: "italic" }}>
                  {user.bio}
                </ThemedText>
              </View>
            ) : null}

            {/* Wallet Stats Section */}
            <View style={[styles.statsSection, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.yellow }}>{user?.coins || 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>COINS</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.link }}>{Array.isArray(user?.awards) ? user.awards.length : 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>TROPHIES</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.accent }}>{user?.totalPoints || 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>XP POINTS</ThemedText>
              </View>
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

        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Card
            onPress={() => handleNavigate(subscriptionItem.route)}
            style={styles.linkCard}
          >
            <View style={[styles.linkIcon, { backgroundColor: subscriptionItem.iconBg }]}>
              <Feather name={subscriptionItem.icon} size={24} color={subscriptionItem.iconColor} />
            </View>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                {subscriptionItem.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Upgraded: {user?.subscriptionTier || 'Silver'}
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
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={editAge}
              onChangeText={setEditAge}
              placeholder="Enter your age"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
            />
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>Gender</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={editGender}
              onChangeText={setEditGender}
              placeholder="Enter your gender"
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

      {/* Photo Options Modal for Android */}
      <Modal visible={showPhotoOptionsModal} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoOptionsModal(false)}>
          <View style={[styles.photoOptionsContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={styles.modalTitle}>Profile Photo</ThemedText>
            <Pressable
              onPress={handlePickImage}
              style={[styles.photoOptionButton, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            >
              <Feather name="upload" size={20} color={theme.text} />
              <ThemedText type="body" style={styles.photoOptionText}>Upload New Photo</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleRemovePhoto}
              style={styles.photoOptionButton}
            >
              <Feather name="trash-2" size={20} color="#DC2626" />
              <ThemedText type="body" style={[styles.photoOptionText, { color: "#DC2626" }]}>Remove Profile Photo</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setShowPhotoOptionsModal(false)}
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
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
  headerContainer: {
    marginBottom: Spacing.sm,
  },
  profileCard: {
    padding: Spacing.xl,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
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
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
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
});
