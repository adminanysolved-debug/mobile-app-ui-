import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

type Award = {
  name: string;
  icon: keyof typeof Feather.glyphMap;
  earned: string;
  color: string;
};

const defaultAwards: Award[] = [
  { name: "Dream Master", icon: "award", earned: "Jan 2024", color: "#EAB308" },
  { name: "Community Hero", icon: "star", earned: "Dec 2023", color: "#8B5CF6" },
  { name: "Goal Achiever", icon: "target", earned: "Nov 2023", color: "#3B82F6" },
];

type TabType = "points" | "awards";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("points");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    if (!token) return;
    try {
      const response = await fetch(new URL('/api/wallet', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const balance = {
    coins: user?.coins || 0,
    awards: user?.awards || 0,
    trophies: user?.trophies || 0,
  };

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

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
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary }}
              >
                Total Balance
              </ThemedText>
              <ThemedText type="h1" style={styles.balanceValue}>
                {balance.coins.toLocaleString()}
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary }}
              >
                Points
              </ThemedText>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => handleAction("add")}
                style={[styles.actionButton, { backgroundColor: theme.link }]}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Add</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleAction("send")}
                style={[styles.actionButton, styles.actionButtonOutline]}
              >
                <Feather name="send" size={18} color="#FFFFFF" />
                <ThemedText style={[styles.actionText, { color: "#FFFFFF" }]}>
                  Send
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleAction("withdraw")}
                style={[styles.actionButton, styles.actionButtonOutline]}
              >
                <Feather name="trending-up" size={18} color="#FFFFFF" />
                <ThemedText style={[styles.actionText, { color: "#FFFFFF" }]}>
                  Withdraw
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <AdBanner variant="compact" />

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View
            style={[styles.tabContainer, { backgroundColor: theme.backgroundDefault }]}
          >
            <Pressable
              onPress={() => setActiveTab("points")}
              style={[
                styles.tab,
                activeTab === "points" ? styles.tabActive : null,
              ]}
            >
              <Feather
                name="star"
                size={16}
                color={activeTab === "points" ? theme.text : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={[
                  styles.tabText,
                  activeTab === "points"
                    ? styles.tabTextActive
                    : { color: theme.textSecondary },
                ]}
              >
                Points
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("awards")}
              style={[
                styles.tab,
                activeTab === "awards" ? styles.tabActive : null,
              ]}
            >
              <Feather
                name="award"
                size={16}
                color={activeTab === "awards" ? theme.text : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={[
                  styles.tabText,
                  activeTab === "awards"
                    ? styles.tabTextActive
                    : { color: theme.textSecondary },
                ]}
              >
                Awards
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {activeTab === "points" ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <ThemedText type="body" style={styles.sectionTitle}>
              Recent Transactions
            </ThemedText>
            {isLoading ? (
              <ActivityIndicator size="large" color="#A78BFA" />
            ) : transactions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Feather name="inbox" size={40} color={theme.textMuted} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No transactions yet
                </ThemedText>
              </Card>
            ) : (
              <Card style={styles.transactionsCard}>
                {transactions.map((transaction, index) => {
                  const isPositive = transaction.amount > 0;
                  return (
                    <View
                      key={transaction.id || index}
                      style={[
                        styles.transactionRow,
                        index < transactions.length - 1
                          ? styles.transactionBorder
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor: isPositive ? "#DCFCE7" : "#FEE2E2",
                          },
                        ]}
                      >
                        <Feather
                          name={isPositive ? "arrow-down-right" : "arrow-up-right"}
                          size={20}
                          color={isPositive ? "#16A34A" : "#DC2626"}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <ThemedText type="body" style={styles.transactionDescription}>
                          {transaction.description}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={{ color: theme.textSecondary }}
                        >
                          {formatDate(transaction.createdAt)}
                        </ThemedText>
                      </View>
                      <ThemedText
                        type="body"
                        style={[
                          styles.transactionAmount,
                          {
                            color: isPositive ? "#16A34A" : "#DC2626",
                          },
                        ]}
                      >
                        {isPositive ? "+" : ""}{transaction.amount}
                      </ThemedText>
                    </View>
                  );
                })}
              </Card>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <ThemedText type="body" style={styles.sectionTitle}>
              My Awards ({balance.awards})
            </ThemedText>
            <View style={styles.awardsGrid}>
              {defaultAwards.map((award, index) => (
                <Card key={award.name} style={styles.awardCard}>
                  <View
                    style={[
                      styles.awardIcon,
                      { backgroundColor: award.color + "20" },
                    ]}
                  >
                    <Feather name={award.icon} size={32} color={award.color} />
                  </View>
                  <ThemedText type="small" style={styles.awardName}>
                    {award.name}
                  </ThemedText>
                  <ThemedText
                    type="xs"
                    style={{ color: theme.textSecondary }}
                  >
                    {award.earned}
                  </ThemedText>
                </Card>
              ))}
            </View>
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
  balanceCard: {
    padding: Spacing.xl,
  },
  balanceHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  balanceValue: {
    marginVertical: Spacing.xs,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  actionButtonOutline: {
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  tabActive: {
    backgroundColor: "#3B82F6",
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
  transactionsCard: {
    padding: 0,
    overflow: "hidden",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 127, 199, 0.3)",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionAmount: {
    fontWeight: "600",
  },
  awardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  awardCard: {
    width: "47%",
    padding: Spacing.xl,
    alignItems: "center",
  },
  awardIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  awardName: {
    fontWeight: "500",
    marginBottom: 2,
    textAlign: "center",
  },
  emptyCard: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
});
