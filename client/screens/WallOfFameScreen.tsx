import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type ApiUser = {
  id: string;
  username: string;
  fullName: string;
  totalPoints: number;
  awards: number;
  dreamsCompleted: number;
  totalDreams: number;
};

type Legend = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  period: string;
  stats: {
    dreams: number;
    achievements: number;
    points: number;
  };
};

type HallOfFamer = {
  id: string;
  name: string;
  year: string;
  category: string;
  count: number;
};

type TabType = "monthly" | "yearly" | "alltime";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getTitleByRank(index: number, awards: number): string {
  const titles = ["Dream Legend", "Goal Master", "Achievement Hunter"];
  return titles[index] || "Champion";
}

function transformApiDataToLegends(users: ApiUser[]): Legend[] {
  return users.slice(0, 3).map((user, index) => ({
    id: user.id,
    name: user.fullName,
    avatar: getInitials(user.fullName),
    title: getTitleByRank(index, user.awards),
    period: `${user.awards}x Champion`,
    stats: {
      dreams: user.dreamsCompleted,
      achievements: user.awards,
      points: user.totalPoints,
    },
  }));
}

function transformApiDataToHallOfFamers(users: ApiUser[]): HallOfFamer[] {
  return users.slice(3, 10).map((user) => ({
    id: user.id,
    name: user.fullName,
    year: new Date().getFullYear().toString(),
    category: "Top Contributor",
    count: user.totalPoints,
  }));
}

export default function WallOfFameScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("monthly");
  const [legends, setLegends] = useState<Legend[]>([]);
  const [hallOfFamers, setHallOfFamers] = useState<HallOfFamer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchWallOfFame() {
    try {
      setIsLoading(true);
      const url = new URL(`/api/wall-of-fame?period=${activeTab}`, getApiUrl()).toString();
      const response = await fetch(url, { credentials: "include" });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as ApiUser[];
      setLegends(transformApiDataToLegends(data));
      setHallOfFamers(transformApiDataToHallOfFamers(data));
    } catch (error) {
      console.error("Failed to fetch wall of fame:", error);
      setLegends([]);
      setHallOfFamers([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchWallOfFame();
    setRefreshing(false);
  }

  useEffect(() => {
    fetchWallOfFame();
  }, [activeTab]);

  useEffect(() => {
    fetchWallOfFame();
  }, []);

  const tabs: { key: TabType; label: string }[] = [
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "alltime", label: "All Time" },
  ];

  const isEmpty = legends.length === 0 && hallOfFamers.length === 0;

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
          isEmpty && styles.emptyScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
        }
      >
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.headerSection}
        >
          <View style={styles.trophyIcon}>
            <Feather name="award" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={styles.headerTitle}>
            Hall of Fame
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.headerSubtitle, { color: theme.textSecondary }]}
          >
            Celebrating our greatest achievers
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View
            style={[styles.tabContainer, { backgroundColor: theme.backgroundDefault }]}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key ? styles.tabActive : null,
                ]}
              >
                <ThemedText
                  type="small"
                  style={[
                    styles.tabText,
                    activeTab === tab.key
                      ? styles.tabTextActive
                      : { color: theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <AdBanner variant="compact" />

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <ThemedText type="body" style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading champions...
            </ThemedText>
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyStateContainer}>
            <Feather name="award" size={48} color={theme.textMuted} />
            <ThemedText type="h4" style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              No Champions Yet
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyStateText, { color: theme.textSecondary }]}
            >
              Start completing dreams to reach the Hall of Fame!
            </ThemedText>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <ThemedText type="body" style={styles.sectionTitle}>
                Legends
              </ThemedText>
              {legends.map((legend, index) => (
                <Card key={legend.id} style={styles.legendCard}>
                  <View style={styles.legendHeader}>
                    <View style={styles.legendAvatar}>
                      <ThemedText style={styles.avatarText}>{legend.avatar}</ThemedText>
                    </View>
                    <View style={styles.legendInfo}>
                      <ThemedText type="h4" style={styles.legendName}>
                        {legend.name}
                      </ThemedText>
                      <ThemedText style={[styles.legendTitle, { color: "#8B5CF6" }]}>
                        {legend.title}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                      >
                        {legend.period}
                      </ThemedText>
                    </View>
                    <View style={styles.crownContainer}>
                      <Feather name="award" size={32} color="#EAB308" />
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText type="h3" style={styles.statValue}>
                        {legend.stats.dreams}
                      </ThemedText>
                      <ThemedText
                        type="xs"
                        style={{ color: theme.textSecondary }}
                      >
                        Dreams
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText type="h3" style={styles.statValue}>
                        {legend.stats.achievements}
                      </ThemedText>
                      <ThemedText
                        type="xs"
                        style={{ color: theme.textSecondary }}
                      >
                        Achievements
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText type="h3" style={styles.statValue}>
                        {legend.stats.points.toLocaleString()}
                      </ThemedText>
                      <ThemedText
                        type="xs"
                        style={{ color: theme.textSecondary }}
                      >
                        Points
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <ThemedText type="body" style={styles.sectionTitle}>
                Hall of Famers
              </ThemedText>
              <Card style={styles.famersCard}>
                {hallOfFamers.map((famer, index) => (
                  <View
                    key={famer.id}
                    style={[
                      styles.famerRow,
                      index < hallOfFamers.length - 1 ? styles.famerBorder : null,
                    ]}
                  >
                    <View style={styles.famerHeader}>
                      <ThemedText type="body" style={styles.famerName}>
                        {famer.name}
                      </ThemedText>
                      <View style={styles.yearBadge}>
                        <ThemedText type="xs" style={styles.yearText}>
                          {famer.year}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {famer.category}
                    </ThemedText>
                    <View style={styles.famerStats}>
                      <Feather name="trending-up" size={16} color={theme.textMuted} />
                      <ThemedText
                        type="small"
                        style={{ color: theme.textMuted, marginLeft: 4 }}
                      >
                        {famer.count} total
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </Card>
            </Animated.View>
          </>
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
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  trophyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    backgroundColor: "#8B5CF6",
  },
  headerTitle: {
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {},
  tabContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#8B5CF6",
  },
  tabText: {
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  legendCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  legendAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
    backgroundColor: "#8B5CF6",
    borderWidth: 4,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    marginBottom: 2,
  },
  legendTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  crownContainer: {
    marginLeft: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    marginBottom: 2,
  },
  famersCard: {
    padding: 0,
    overflow: "hidden",
  },
  famerRow: {
    padding: Spacing.lg,
  },
  famerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 127, 199, 0.3)",
  },
  famerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  famerName: {
    fontWeight: "600",
  },
  yearBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  yearText: {
    color: "#A78BFA",
    fontWeight: "500",
  },
  famerStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl * 4,
  },
  loadingText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 4,
  },
  emptyStateTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    maxWidth: 280,
  },
});
