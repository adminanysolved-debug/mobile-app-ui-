import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';




type Dream = {
  id: string;
  title: string;
  description?: string;
  type: "personal" | "challenge" | "group";
  progress: number;
  isCompleted: boolean;
  targetDate?: string;
  createdAt: string;
};

function DreamCard({
  dream,
  index,
  onRefresh,
}: {
  dream: Dream;
  index: number;
  onRefresh: () => void;
}) {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("DreamDetail", { dreamId: dream.id });
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMenu(false);
    navigation.navigate("CreateDream", {
      type: dream.type,
      editMode: true,
      dreamData: dream,
    });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMenu(false);

    Alert.alert(
      "Delete Dream",
      "Are you sure you want to delete this dream?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                new URL(`/api/dreams/${dream.id}`, getApiUrl()).toString(),
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                onRefresh();
              }
            } catch (error) {
              console.error("Failed to delete dream:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Card style={styles.dreamCard} onPress={handlePress}>
        <View style={styles.dreamHeader}>
          <View style={styles.dreamContent}>
            <ThemedText type="bodyMedium" numberOfLines={1}>
              {dream.title}
            </ThemedText>

            {dream.description ? (
              <ThemedText type="small" style={styles.description} numberOfLines={2}>
                {dream.description}
              </ThemedText>
            ) : null}
          </View>

          {!dream.isCompleted && (
            <View style={styles.cardActions}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                style={styles.menuButton}
              >
                <Feather name="more-vertical" size={20} color="#8B7FC7" />
              </Pressable>

              {showMenu && (
                <View style={styles.menuDropdown}>
                  <Pressable style={styles.menuItem} onPress={handleEdit}>
                    <Feather name="edit-2" size={16} color="#60A5FA" />
                    <ThemedText type="small">Edit</ThemedText>
                  </Pressable>

                  <Pressable style={styles.menuItem} onPress={handleDelete}>
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <ThemedText type="small" style={{ color: "#EF4444" }}>
                      Delete
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

export default function PersonalDreamsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDreams = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(new URL('/api/dreams?type=personal', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDreams(data.filter((d: Dream) => d.type === "personal"));
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchDreams();
    }, [fetchDreams])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDreams();
  };

  const handleCreateDream = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateDream", { type: "personal" });
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg + Spacing.xl,
        paddingBottom: tabBarHeight + insets.bottom + 140,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />
        }
      >
        <AdBanner variant="compact" />

        {isLoading ? (
          <ActivityIndicator size="large" color="#A78BFA" style={{ marginTop: Spacing["3xl"] }} />
        ) : dreams.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Feather name="user" size={40} color="#3B82F6" />
              </View>
              <ThemedText type="body" style={styles.emptyTitle}>No Personal Dreams Yet</ThemedText>
              <ThemedText type="small" style={styles.emptyDescription}>
                Start your personal journey by creating your first dream
              </ThemedText>
            </Card>
          </Animated.View>
        ) : (
          dreams.map((dream, idx) => (
            <DreamCard
              key={dream.id}
              dream={dream}
              index={idx}
              onRefresh={fetchDreams}
            />
          ))
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            onPress={handleCreateDream}
            style={styles.createButton}
            testID="button-create-personal-dream"
          >
            <View style={styles.createButtonContent}>
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>
                CREATE PERSONAL DREAM
              </ThemedText>
            </View>
          </Button>
        </Animated.View>
      </ScrollView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  dreamCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    overflow: "visible",
  },
  dreamHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dreamIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  dreamContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  dreamTitle: {
    color: "#FFFFFF",
  },
  dreamDescription: {
    color: "#C4B5FD",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(139, 127, 199, 0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  progressText: {
    color: "#8B7FC7",
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    color: "#C4B5FD",
    textAlign: "center",
  },
  createButton: {
    marginTop: Spacing.lg,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  cardActions: {
    position: "relative",
    overflow: "visible",
  },
  menuButton: {
    padding: Spacing.xs,
  },
  menuDropdown: {
    position: "absolute",
    top: 36,
    right: 0,
    backgroundColor: "rgba(25, 20, 50, 0.98)",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
    minWidth: 140,
    zIndex: 9999,
    elevation: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 127, 199, 0.1)",
  },
  description: {
    marginTop: Spacing.xs,
    color: "#B8B5E5",
  },
});
