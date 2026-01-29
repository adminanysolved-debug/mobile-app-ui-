import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type LeaderboardUser = {
  id: string;
  username: string;
  fullName: string;
  totalPoints: number;
  awards: number;
  dreamsCompleted: number;
  totalDreams: number;
  profileImage?: string;
};

const medalColors: Record<string, [string, string]> = {
  gold: ["#EAB308", "#FCD34D"],
  silver: ["#6B7280", "#9CA3AF"],
  bronze: ["#EA580C", "#FB923C"],
};

function getMedalType(rank: number): "gold" | "silver" | "bronze" | null {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

export default function ChampionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(new URL('/api/leaderboard?limit=10', getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const handleNavigateToWallOfFame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WallOfFame");
  };

  const handleChampionPress = (user: LeaderboardUser, rank: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedUser(user);
    setSelectedRank(rank);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedUser(null);
      setSelectedRank(0);
    }, 300);
  };

  const topChampions = leaderboard.slice(0, 3);
  const risingStars = leaderboard.slice(3, 6);

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card
            onPress={handleNavigateToWallOfFame}
            style={styles.linkCard}
          >
            <LinearGradient
              colors={["#EAB308", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkIcon}
            >
              <Feather name="award" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                Hall of Fame
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                View legendary achievers
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card
            onPress={handleNavigateToWallOfFame}
            style={styles.linkCard}
          >
            <LinearGradient
              colors={["#8B5CF6", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkIcon}
            >
              <Feather name="star" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={styles.linkTitle}>
                Wall of Fame
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Celebrate top performers
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Card>
        </Animated.View>

        <AdBanner variant="compact" />

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText
              type="xs"
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
            >
              TOP CHAMPIONS THIS MONTH
            </ThemedText>
            <Pressable onPress={handleNavigateToWallOfFame}>
              <ThemedText type="small" style={{ color: theme.link }}>
                See All
              </ThemedText>
            </Pressable>
          </View>
          <Card style={styles.championsCard}>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.link} style={{ padding: Spacing.xl }} />
            ) : topChampions.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="award" size={32} color={theme.textMuted} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                  No champions yet
                </ThemedText>
              </View>
            ) : (
              topChampions.map((user, index) => {
                const rank = index + 1;
                const medal = getMedalType(rank);
                return (
                  <Pressable
                    key={user.id}
                    onPress={() => handleChampionPress(user, rank)}
                    style={[
                      styles.championRow,
                      index < topChampions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null,
                    ]}
                  >
                    <LinearGradient
                      colors={medal ? medalColors[medal] : ["#6B7280", "#9CA3AF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rankBadge}
                    >
                      <ThemedText style={styles.rankText}>#{rank}</ThemedText>
                    </LinearGradient>
                    <View style={styles.championInfo}>
                      <ThemedText type="body" style={styles.championName}>
                        {user.fullName || user.username}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                      >
                        {user.dreamsCompleted} dreams completed
                      </ThemedText>
                    </View>
                    <View style={styles.medalContainer}>
                      <Feather
                        name={medal === "gold" ? "award" : medal === "silver" ? "star" : "hexagon"}
                        size={24}
                        color={medal === "gold" ? "#EAB308" : medal === "silver" ? "#9CA3AF" : "#EA580C"}
                      />
                    </View>
                  </Pressable>
                );
              })
            )}
          </Card>
        </Animated.View>

        {risingStars.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <ThemedText
              type="xs"
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
            >
              RISING STARS
            </ThemedText>
            <Card style={styles.starsCard}>
              {risingStars.map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.starRow,
                    index < risingStars.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null,
                  ]}
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.starAvatar}
                  >
                    <Feather name="trending-up" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.starInfo}>
                    <ThemedText type="body" style={styles.starName}>
                      {user.fullName || user.username}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {user.totalPoints.toLocaleString()} points - {user.awards} awards
                    </ThemedText>
                  </View>
                  <Feather name="star" size={20} color={theme.yellow} />
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {selectedUser ? (
            <Animated.View
              entering={FadeIn}
              style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            >
              <LinearGradient
                colors={selectedRank <= 3 ? medalColors[getMedalType(selectedRank) || "bronze"] : ["#6B7280", "#9CA3AF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeader}
              >
                <View style={styles.modalMedal}>
                  <Feather name="award" size={48} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.modalRank}>
                  #{selectedRank}
                </ThemedText>
                <ThemedText style={styles.modalMedalType}>
                  {selectedRank === 1 ? "GOLD" : selectedRank === 2 ? "SILVER" : selectedRank === 3 ? "BRONZE" : "TOP"} ACHIEVER
                </ThemedText>
              </LinearGradient>

              <View style={styles.modalBody}>
                <ThemedText type="h3" style={styles.modalName}>
                  {selectedUser.fullName || selectedUser.username}
                </ThemedText>

                <ThemedText
                  type="body"
                  style={[styles.modalDescription, { color: theme.textSecondary }]}
                >
                  @{selectedUser.username}
                </ThemedText>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="target" size={24} color={theme.link} />
                    <ThemedText type="h3" style={styles.statValue}>
                      {selectedUser.dreamsCompleted}
                    </ThemedText>
                    <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                      Dreams
                    </ThemedText>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="star" size={24} color={theme.yellow} />
                    <ThemedText type="h3" style={styles.statValue}>
                      {selectedUser.totalPoints.toLocaleString()}
                    </ThemedText>
                    <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                      Points
                    </ThemedText>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="award" size={24} color={theme.purple} />
                    <ThemedText type="h3" style={styles.statValue}>
                      {selectedUser.awards}
                    </ThemedText>
                    <ThemedText type="xs" style={{ color: theme.textSecondary }}>
                      Awards
                    </ThemedText>
                  </View>
                </View>

                <Button onPress={handleCloseModal} style={styles.closeButton}>
                  Close
                </Button>
              </View>
            </Animated.View>
          ) : null}
        </View>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  championsCard: {
    padding: Spacing.lg,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  championRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  championInfo: {
    flex: 1,
  },
  championName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  medalContainer: {
    padding: Spacing.xs,
  },
  starsCard: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  starAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  starInfo: {
    flex: 1,
  },
  starName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  modalMedal: {
    marginBottom: Spacing.md,
  },
  modalRank: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  modalMedalType: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalBody: {
    padding: Spacing.xl,
  },
  modalName: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statValue: {
    marginVertical: Spacing.xs,
  },
  closeButton: {
    width: "100%",
  },
});
