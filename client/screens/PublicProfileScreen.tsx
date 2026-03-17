import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function PublicProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { userId } = route.params || {};
  const { theme } = useTheme();
  const { token, user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const fetchUserProfile = async () => {
    if (!userId) return;
    try {
      const response = await fetch(new URL(`/api/users/${userId}`, getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!token || !user) return;
    setIsUpdatingFollow(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(new URL(`/api/users/${userId}/follow`, getApiUrl()).toString(), {
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

  if (isLoading) {
    return (
      <GalaxyBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.link} />
        </View>
      </GalaxyBackground>
    );
  }

  if (!user) {
    return (
      <GalaxyBackground>
        <View style={styles.errorContainer}>
          <ThemedText type="h3">User not found</ThemedText>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ThemedText type="body">Go Back</ThemedText>
          </Pressable>
        </View>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">Profile</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user.profilePhoto || user.profileImage ? (
                <Image source={{ uri: user.profilePhoto || user.profileImage }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={theme.gradient} style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color="#FFF" />
                </LinearGradient>
              )}
            </View>

            <View style={styles.infoContainer}>
              <ThemedText type="h2" style={styles.username}>@{user.username}</ThemedText>
              <ThemedText type="body" style={styles.fullName}>{user.fullName}</ThemedText>
              
              {user.bio ? (
                <ThemedText type="body" style={[styles.bio, { color: theme.textSecondary }]}>
                  {user.bio}
                </ThemedText>
              ) : null}

              {currentUser?.id !== user.id && (
                <Pressable
                  onPress={handleFollowToggle}
                  disabled={isUpdatingFollow}
                  style={[
                    styles.followButton,
                    { backgroundColor: isFollowing ? theme.backgroundSecondary : theme.accent }
                  ]}
                >
                  <ThemedText type="bodyMedium" style={{ color: isFollowing ? theme.text : "#FFF" }}>
                    {isFollowing ? "Following" : "Follow"}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <View style={[styles.statsRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.yellow }}>{user.coins || 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>COINS</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.link }}>{Array.isArray(user.awards) ? user.awards.length : 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>TROPHIES</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="h3" style={{ color: theme.accent }}>{user.totalPoints || 0}</ThemedText>
                <ThemedText type="xs" style={{ color: theme.textSecondary }}>XP POINTS</ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <AdBanner />
      </ScrollView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  backIcon: { padding: Spacing.sm },
  profileCard: { padding: Spacing.xl, alignItems: "center" },
  avatarContainer: { marginBottom: Spacing.md },
  avatar: { width: 100, height: 100, borderRadius: BorderRadius.full },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: BorderRadius.full, alignItems: "center", justifyContent: "center" },
  infoContainer: { alignItems: "center", width: "100%", marginBottom: Spacing.lg },
  username: { marginBottom: 4 },
  fullName: { color: "#AAA", marginBottom: Spacing.md },
  bio: { textAlign: "center", fontStyle: "italic", marginBottom: Spacing.lg },
  followButton: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, width: "60%", alignItems: "center" },
  statsRow: { flexDirection: "row", width: "100%", paddingTop: Spacing.lg, justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statDivider: { width: 1, height: 24, opacity: 0.2 },
  backButton: { padding: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: "rgba(255,255,255,0.1)" }
});
